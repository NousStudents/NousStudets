import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Users, Search, ArrowLeft, MoreVertical, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { FileUploadButton } from "@/components/messaging/FileUploadButton";

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
  isOnline?: boolean;
  isTyping?: boolean;
}

interface SchoolUser {
  user_id: string;
  full_name: string;
  role: string;
  email: string;
  profile_image?: string;
  isOnline?: boolean;
}

interface ChatRequest {
  request_id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
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
  const [chatRequests, setChatRequests] = useState<ChatRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ChatRequest[]>([]);
  const [userStatuses, setUserStatuses] = useState<Record<string, { isOnline: boolean; lastSeen: string }>>({});
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchCurrentUserData();
    }
  }, [user, role]);

  useEffect(() => {
    if (currentUserId && schoolId) {
      updateUserStatus(true);
      fetchConversations();
      fetchSchoolUsers();
      fetchChatRequests();
      subscribeToRealtime();

      return () => {
        updateUserStatus(false);
      };
    }
  }, [currentUserId, schoolId]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const updateUserStatus = async (isOnline: boolean) => {
    try {
      await supabase.from("user_status").upsert({
        user_id: currentUserId,
        is_online: isOnline,
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

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

      // Fetch user statuses
      const { data: statuses } = await supabase
        .from("user_status")
        .select("*")
        .in("user_id", users.map(u => u.user_id));

      const statusMap: Record<string, { isOnline: boolean; lastSeen: string }> = {};
      statuses?.forEach(s => {
        statusMap[s.user_id] = { isOnline: s.is_online, lastSeen: s.last_seen };
      });
      setUserStatuses(statusMap);
    } catch (error) {
      console.error("Error fetching school users:", error);
    }
  };

  const fetchChatRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_requests")
        .select("*")
        .eq("school_id", schoolId)
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`);

      if (error) throw error;

      setChatRequests(data || []);
      setPendingRequests(data?.filter(r => r.receiver_id === currentUserId && r.status === "pending") || []);
    } catch (error) {
      console.error("Error fetching chat requests:", error);
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
          const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
          convMap.set(convId, {
            id: convId,
            name: msg.group_name || "Chat",
            lastMessage: msg.message_text || "📎 Attachment",
            timestamp: msg.sent_at,
            isGroup: msg.is_group || false,
            unreadCount: msg.read_at || msg.sender_id === currentUserId ? 0 : 1,
            otherUserId,
            isOnline: userStatuses[otherUserId]?.isOnline || false,
            isTyping: typingUsers[convId] || false,
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
              conv.isOnline = userStatuses[conv.otherUserId]?.isOnline || false;
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

      // Mark messages as read
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("receiver_id", currentUserId)
        .eq("conversation_id", conversationId)
        .is("read_at", null);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const subscribeToRealtime = () => {
    // Subscribe to messages
    const messagesChannel = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as Message;
            if (
              (newMsg.sender_id === currentUserId || newMsg.receiver_id === currentUserId) &&
              selectedConversation === (newMsg.conversation_id || (newMsg.sender_id === currentUserId ? newMsg.receiver_id : newMsg.sender_id))
            ) {
              setMessages(prev => [...prev, newMsg]);
            }
          }
          fetchConversations();
        }
      )
      .subscribe();

    // Subscribe to user statuses
    const statusChannel = supabase
      .channel("user-status-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_status",
        },
        (payload) => {
          const status = payload.new as any;
          setUserStatuses(prev => ({
            ...prev,
            [status.user_id]: { isOnline: status.is_online, lastSeen: status.last_seen },
          }));
          fetchConversations();
        }
      )
      .subscribe();

    // Subscribe to typing indicators
    const typingChannel = supabase
      .channel("typing-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
        },
        (payload) => {
          const typing = payload.new as any;
          if (typing.conversation_id === selectedConversation && typing.user_id !== currentUserId) {
            setTypingUsers(prev => ({ ...prev, [typing.conversation_id]: typing.is_typing }));
            setTimeout(() => {
              setTypingUsers(prev => ({ ...prev, [typing.conversation_id]: false }));
            }, 3000);
          }
        }
      )
      .subscribe();

    // Subscribe to chat requests
    const requestsChannel = supabase
      .channel("chat-requests-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_requests",
        },
        () => {
          fetchChatRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(statusChannel);
      supabase.removeChannel(typingChannel);
      supabase.removeChannel(requestsChannel);
    };
  };

  const handleTyping = () => {
    if (!selectedConversation) return;

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing indicator
    supabase.from("typing_indicators").upsert({
      conversation_id: selectedConversation,
      user_id: currentUserId,
      is_typing: true,
      updated_at: new Date().toISOString(),
    });

    // Clear typing after 3 seconds
    typingTimeoutRef.current = setTimeout(() => {
      supabase.from("typing_indicators").upsert({
        conversation_id: selectedConversation,
        user_id: currentUserId,
        is_typing: false,
        updated_at: new Date().toISOString(),
      });
    }, 3000);
  };

  const canMessageUser = (targetUserId: string, targetRole: string): boolean => {
    // Admins and teachers can message anyone
    if (role === "admin" || role === "teacher") return true;

    // Students can message teachers and admins directly
    if (role === "student" && (targetRole === "teacher" || targetRole === "admin")) return true;

    // For student-to-student, check if request is accepted
    if (role === "student" && targetRole === "student") {
      const existingRequest = chatRequests.find(
        r =>
          ((r.sender_id === currentUserId && r.receiver_id === targetUserId) ||
            (r.sender_id === targetUserId && r.receiver_id === currentUserId)) &&
          r.status === "accepted"
      );
      return !!existingRequest;
    }

    return true;
  };

  const sendChatRequest = async (receiverId: string) => {
    try {
      const { error } = await supabase.from("chat_requests").insert({
        sender_id: currentUserId,
        receiver_id: receiverId,
        school_id: schoolId,
        status: "pending",
      });

      if (error) throw error;
      toast.success("Chat request sent!");
      fetchChatRequests();
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Request already sent");
      } else {
        toast.error("Failed to send request");
      }
    }
  };

  const acceptChatRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("chat_requests")
        .update({ status: "accepted" })
        .eq("request_id", requestId);

      if (error) throw error;
      toast.success("Chat request accepted!");
      fetchChatRequests();
    } catch (error) {
      toast.error("Failed to accept request");
    }
  };

  const rejectChatRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("chat_requests")
        .update({ status: "rejected" })
        .eq("request_id", requestId);

      if (error) throw error;
      toast.success("Chat request rejected");
      fetchChatRequests();
    } catch (error) {
      toast.error("Failed to reject request");
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUserId,
        receiver_id: selectedConversation,
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

  const startNewChat = (userId: string, userRole: string) => {
    if (!canMessageUser(userId, userRole)) {
      const hasPendingRequest = chatRequests.find(
        r => r.sender_id === currentUserId && r.receiver_id === userId && r.status === "pending"
      );
      if (hasPendingRequest) {
        toast.info("Request already sent. Waiting for acceptance.");
      } else {
        sendChatRequest(userId);
      }
      return;
    }

    setSelectedConversation(userId);
    setShowNewChat(false);
  };

  const handleFileUploaded = async (fileUrl: string, fileName: string, fileType: string) => {
    if (!selectedConversation) return;

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUserId,
        receiver_id: selectedConversation,
        message_text: fileName,
        school_id: schoolId,
        conversation_id: selectedConversation,
        file_url: fileUrl,
        file_name: fileName,
        file_type: fileType,
        message_type: "file",
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error sending file:", error);
      toast.error("Failed to send file");
    }
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

      {pendingRequests.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <p className="font-medium text-sm mb-2">Chat Requests ({pendingRequests.length})</p>
          <div className="space-y-2">
            {pendingRequests.map((req) => {
              const sender = schoolUsers.find(u => u.user_id === req.sender_id);
              return (
                <div key={req.request_id} className="flex items-center justify-between bg-white rounded-lg p-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-blue-200 text-blue-700 text-xs">
                        {getInitials(sender?.full_name || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{sender?.full_name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => acceptChatRequest(req.request_id)}>Accept</Button>
                    <Button size="sm" variant="outline" onClick={() => rejectChatRequest(req.request_id)}>Decline</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                {filteredUsers.map((user) => {
                  const userOnline = userStatuses[user.user_id]?.isOnline || false;
                  const canMessage = canMessageUser(user.user_id, user.role);
                  const hasPendingRequest = chatRequests.find(
                    r => r.sender_id === currentUserId && r.receiver_id === user.user_id && r.status === "pending"
                  );

                  return (
                    <button
                      key={user.user_id}
                      onClick={() => startNewChat(user.user_id, user.role)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-200 text-blue-700">
                            {getInitials(user.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        {userOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                      </div>
                      {!canMessage && hasPendingRequest && (
                        <span className="text-xs text-yellow-600">Pending</span>
                      )}
                      {!canMessage && !hasPendingRequest && role === "student" && user.role === "student" && (
                        <span className="text-xs text-blue-600">Request</span>
                      )}
                    </button>
                  );
                })}
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
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-green-200 text-green-700">
                        {conv.isGroup ? <Users className="h-5 w-5" /> : getInitials(conv.name)}
                      </AvatarFallback>
                    </Avatar>
                    {conv.isOnline && !conv.isGroup && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 text-left overflow-hidden">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm truncate">{conv.name}</p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(conv.timestamp), "HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.isTyping ? "typing..." : conv.lastMessage}
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
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-blue-200 text-blue-700">
                        {selectedConvData?.isGroup ? (
                          <Users className="h-5 w-5" />
                        ) : (
                          getInitials(selectedConvData?.name || "")
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {selectedConvData?.isOnline && !selectedConvData.isGroup && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{selectedConvData?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedConvData?.isOnline ? "Online" : "Offline"}
                    </p>
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
                              {getInitials(selectedConvData?.name || "U")}
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
                                  className="flex items-center gap-2 underline text-sm"
                                >
                                  📎 {msg.file_name}
                                </a>
                              )}
                            </div>
                          )}
                          <p className="text-sm">{msg.message_text}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <p
                              className={cn(
                                "text-xs",
                                isOwn ? "text-green-100" : "text-muted-foreground"
                              )}
                            >
                              {format(new Date(msg.sent_at), "HH:mm")}
                            </p>
                            {isOwn && (
                              <span className="text-green-100">
                                {msg.read_at ? (
                                  <CheckCheck className="h-3 w-3" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {typingUsers[selectedConversation] && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-200 text-blue-700 text-xs">
                          {getInitials(selectedConvData?.name || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-white rounded-2xl px-4 py-2">
                        <p className="text-sm text-muted-foreground">typing...</p>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              <div className="bg-card border-t border-border p-4">
                <div className="flex items-center gap-2">
                  <FileUploadButton onFileUploaded={handleFileUploaded} />
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
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
