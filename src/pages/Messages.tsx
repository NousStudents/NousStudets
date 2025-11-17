import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Users, MessageCircle, Plus, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";
import { FileUploadButton } from "@/components/messaging/FileUploadButton";
import { GroupChatDialog } from "@/components/messaging/GroupChatDialog";
import { MessageSearch, SearchFilters } from "@/components/messaging/MessageSearch";

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
}

export default function Messages() {
  const { user } = useAuth();
  const { role } = useRole();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string; type: string } | null>(null);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchConversations();
      subscribeToMessages();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    setFilteredMessages(messages);
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order("sent_at", { ascending: false });

      if (error) throw error;

      // Group messages by conversation
      const convMap = new Map<string, Conversation>();
      data?.forEach((msg) => {
        const convId = msg.conversation_id || msg.sender_id + msg.receiver_id;
        if (!convMap.has(convId)) {
          convMap.set(convId, {
            id: convId,
            name: msg.group_name || "Direct Message",
            lastMessage: msg.message_text,
            timestamp: msg.sent_at,
            isGroup: msg.is_group,
            unreadCount: msg.read_at ? 0 : 1,
          });
        }
      });

      setConversations(Array.from(convMap.values()));
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
        .eq("conversation_id", conversationId)
        .order("sent_at", { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.conversation_id === selectedConversation) {
            setMessages((prev) => [...prev, newMsg]);
          }
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !uploadedFile) || !selectedConversation) return;

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user?.id,
        receiver_id: selectedConversation,
        message_text: newMessage || (uploadedFile ? "Sent a file" : ""),
        conversation_id: selectedConversation,
        school_id: user?.user_metadata?.school_id,
        message_type: uploadedFile ? "file" : "text",
        file_url: uploadedFile?.url,
        file_name: uploadedFile?.name,
        file_type: uploadedFile?.type,
      });

      if (error) throw error;
      setNewMessage("");
      setUploadedFile(null);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleSearch = (filters: SearchFilters) => {
    let filtered = [...messages];

    if (filters.query) {
      filtered = filtered.filter((msg) =>
        msg.message_text.toLowerCase().includes(filters.query.toLowerCase())
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(
        (msg) => new Date(msg.sent_at) >= filters.dateFrom!
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(
        (msg) => new Date(msg.sent_at) <= filters.dateTo!
      );
    }

    if (filters.messageType) {
      filtered = filtered.filter((msg) => msg.message_type === filters.messageType);
    }

    setFilteredMessages(filtered);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto p-4 h-screen">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
        {/* Conversations List */}
        <Card className="md:col-span-1 animate-fade-in">
          <CardHeader className="bg-gradient-blue-purple">
            <CardTitle className="text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Messages
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setGroupDialogOpen(true)}
                className="text-white hover:bg-white/20"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-200px)]">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.id)}
                  className={`p-4 cursor-pointer hover:bg-pastel-blue/20 transition-all ${
                    selectedConversation === conv.id ? "bg-pastel-blue/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-gradient-pink-yellow text-white">
                        {conv.isGroup ? <Users className="w-4 h-4" /> : getInitials(conv.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <p className="font-semibold truncate">{conv.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(conv.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="bg-pastel-pink text-white text-xs rounded-full px-2 py-1">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-2 flex flex-col animate-fade-in">
          <CardHeader className="bg-gradient-green-blue">
            <CardTitle className="text-white">
              {selectedConversation ? "Chat" : "Select a conversation"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-4">
            {selectedConversation && (
              <div className="mb-4">
                <MessageSearch onSearch={handleSearch} />
              </div>
            )}
            <ScrollArea className="flex-1 pr-4">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.message_id}
                  className={`mb-4 flex ${
                    msg.sender_id === user?.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      msg.sender_id === user?.id
                        ? "bg-gradient-blue-purple text-white"
                        : "bg-pastel-blue/20"
                    }`}
                  >
                    {msg.file_url && (
                      <div className="mb-2 flex items-center gap-2 text-sm">
                        <Paperclip className="w-4 h-4" />
                        <a href={msg.file_url} target="_blank" className="underline">
                          {msg.file_name}
                        </a>
                      </div>
                    )}
                    <p>{msg.message_text}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {new Date(msg.sent_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </ScrollArea>

            {selectedConversation && (
              <div className="space-y-2 mt-4">
                {uploadedFile && (
                  <div className="px-3 py-2 bg-muted rounded-lg text-sm flex items-center justify-between">
                    <span className="truncate">{uploadedFile.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setUploadedFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
                <div className="flex gap-2">
                  <FileUploadButton
                    onFileUploaded={(url, name, type) =>
                      setUploadedFile({ url, name, type })
                    }
                  />
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} variant="pastelBlue" size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <GroupChatDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        onGroupCreated={() => {
          fetchConversations();
          toast.success("Group chat created!");
        }}
      />
    </div>
  );
}
