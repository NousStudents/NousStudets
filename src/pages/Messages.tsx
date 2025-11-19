import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Users, Search, Paperclip, Image as ImageIcon, ArrowLeft, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Message {
  message_id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  sent_at: string;
  read_at: string | null;
  conversation_id: string | null;
  is_group: boolean;
  group_name: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  message_type: string | null;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  isGroup: boolean;
  unreadCount: number;
  avatar?: string;
  otherUserId?: string;
}

interface SchoolUser {
  user_id: string;
  full_name: string;
  role: string;
  email: string;
  profile_image?: string;
}

export default function Messages() {
  const { user } = useAuth();
  const { role } = useRole();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [schoolUsers, setSchoolUsers] = useState<SchoolUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [schoolId, setSchoolId] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchCurrentUserData();
    }
  }, [user, role]);

  useEffect(() => {
    if (currentUserId && schoolId) {
      fetchConversations();
      fetchSchoolUsers();
      subscribeToMessages();
    }
  }, [currentUserId, schoolId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  const fetchCurrentUserData = async () => {
    try {
      let userId = "";
      let userSchoolId = "";

      if (role === "admin") {
        const { data } = await supabase
          .from("admins")
          .select("admin_id, school_id")
          .eq("auth_user_id", user?.id)
          .single();
        userId = data?.admin_id || "";
        userSchoolId = data?.school_id || "";
      } else if (role === "teacher") {
        const { data } = await supabase
          .from("teachers")
          .select("teacher_id, school_id")
          .eq("auth_user_id", user?.id)
          .single();
        userId = data?.teacher_id || "";
        userSchoolId = data?.school_id || "";
      } else if (role === "student") {
        const { data } = await supabase
          .from("students")
          .select("student_id, classes(school_id)")
          .eq("auth_user_id", user?.id)
          .single();
        userId = data?.student_id || "";
        userSchoolId = (data?.classes as any)?.school_id || "";
      } else if (role === "parent") {
        const { data } = await supabase
          .from("parents")
          .select("parent_id, school_id")
          .eq("auth_user_id", user?.id)
          .single();
        userId = data?.parent_id || "";
        userSchoolId = data?.school_id || "";
      }

      setCurrentUserId(userId);
      setSchoolId(userSchoolId);
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchSchoolUsers = async () => {
    try {
      const users: SchoolUser[] = [];

      const { data: admins } = await supabase
        .from("admins")
        .select("admin_id, full_name, email, profile_image")
        .eq("school_id", schoolId);
      admins?.forEach(a => users.push({ user_id: a.admin_id, full_name: a.full_name, role: "admin", email: a.email, profile_image: a.profile_image || undefined }));

      const { data: teachers } = await supabase
        .from("teachers")
        .select("teacher_id, full_name, email, profile_image")
        .eq("school_id", schoolId);
      teachers?.forEach(t => users.push({ user_id: t.teacher_id, full_name: t.full_name, role: "teacher", email: t.email, profile_image: t.profile_image || undefined }));

      const { data: students } = await supabase
        .from("students")
        .select("student_id, full_name, email, profile_picture, classes!inner(school_id)")
        .eq("classes.school_id", schoolId);
      students?.forEach(s => users.push({ user_id: s.student_id, full_name: s.full_name, role: "student", email: s.email, profile_image: s.profile_picture || undefined }));

      const { data: parents } = await supabase
        .from("parents")
        .select("parent_id, full_name, email, profile_image")
        .eq("school_id", schoolId);
      parents?.forEach(p => users.push({ user_id: p.parent_id, full_name: p.full_name, role: "parent", email: p.email, profile_image: p.profile_image || undefined }));

      setSchoolUsers(users.filter(u => u.user_id !== currentUserId));
    } catch (error) {
      console.error("Error fetching school users:", error);
    }
  };

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("sent_at", { ascending: false });

      if (error) throw error;

      const convMap = new Map<string, Conversation>();
      data?.forEach((msg) => {
        const convId = msg.conversation_id || (msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id);
        if (!convMap.has(convId)) {
          convMap.set(convId, {
            id: convId,
            name: msg.group_name || "Chat",
            lastMessage: msg.message_text || "📎 Attachment",
            timestamp: msg.sent_at,
            isGroup: msg.is_group || false,
            unreadCount: msg.read_at ? 0 : 1,
            otherUserId: msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id,
          });
        }
      });

      const enrichedConvs = await Promise.all(
        Array.from(convMap.values()).map(async (conv) => {
          if (!conv.isGroup && conv.otherUserId) {
            const user = schoolUsers.find(u => u.user_id === conv.otherUserId);
            if (user) {
              conv.name = user.full_name;
              conv.avatar = user.profile_image;
            }
          }
          return conv;
        })
      );

      setConversations(enrichedConvs);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`conversation_id.eq.${conversationId},sender_id.eq.${conversationId},receiver_id.eq.${conversationId}`)
        .order("sent_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("receiver_id", currentUserId)
        .is("read_at", null);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations();
          if (selectedConversation) {
            fetchMessages(selectedConversation);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedConversation) return;

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUserId,
        receiver_id: selectedConversation || "",
        message_text: newMessage,
        school_id: schoolId,
        conversation_id: selectedConversation,
      });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const startNewChat = (userId: string) => {
    setSelectedConversation(userId);
    setShowNewChat(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const selectedConvData = conversations.find(c => c.id === selectedConversation);

  const filteredUsers = schoolUsers.filter(u =>
    u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold text-foreground">Messages</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowNewChat(!showNewChat)}
        >
          <Users className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className={cn(
          "w-full md:w-96 bg-card border-r border-border flex flex-col",
          selectedConversation && "hidden md:flex"
        )}>
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
          </div>

          {showNewChat && (
            <div className="p-3 border-b border-border bg-blue-50">
              <h3 className="font-medium mb-2 text-sm">School Members</h3>
              <ScrollArea className="h-48">
                {filteredUsers.map((user) => (
                  <button
                    key={user.user_id}
                    onClick={() => startNewChat(user.user_id)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-200 text-blue-700">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </div>
          )}

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No conversations yet
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 hover:bg-accent transition-colors border-b border-border",
                    selectedConversation === conv.id && "bg-accent"
                  )}
                >
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-green-200 text-green-700">
                      {conv.isGroup ? <Users className="h-5 w-5" /> : getInitials(conv.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm truncate">{conv.name}</p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(conv.timestamp), "HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {conv.unreadCount}
                    </div>
                  )}
                </button>
              ))
            )}
          </ScrollArea>
        </div>

        <div className={cn(
          "flex-1 flex flex-col bg-green-50",
          !selectedConversation && "hidden md:flex"
        )}>
          {selectedConversation ? (
            <>
              <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-200 text-blue-700">
                      {selectedConvData?.isGroup ? (
                        <Users className="h-5 w-5" />
                      ) : (
                        getInitials(selectedConvData?.name || "")
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedConvData?.name}</p>
                    <p className="text-xs text-muted-foreground">Online</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === currentUserId;
                    return (
                      <div
                        key={msg.message_id}
                        className={cn(
                          "flex items-end gap-2",
                          isOwn ? "justify-end" : "justify-start"
                        )}
                      >
                        {!isOwn && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-200 text-blue-700 text-xs">
                              U
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "max-w-[70%] rounded-2xl px-4 py-2",
                            isOwn
                              ? "bg-green-500 text-white rounded-br-none"
                              : "bg-white text-foreground rounded-bl-none"
                          )}
                        >
                          {msg.file_url && (
                            <div className="mb-2">
                              {msg.file_type?.startsWith("image/") ? (
                                <img
                                  src={msg.file_url}
                                  alt={msg.file_name || "Image"}
                                  className="rounded-lg max-w-full"
                                />
                              ) : (
                                <a
                                  href={msg.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 underline"
                                >
                                  <Paperclip className="h-4 w-4" />
                                  {msg.file_name}
                                </a>
                              )}
                            </div>
                          )}
                          <p className="text-sm">{msg.message_text}</p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              isOwn ? "text-green-100" : "text-muted-foreground"
                            )}
                          >
                            {format(new Date(msg.sent_at), "HH:mm")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="bg-card border-t border-border p-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                  </Button>
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    className="flex-1 bg-background"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
