import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  name: string;
  role: string;
}

interface GroupChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated: () => void;
}

export function GroupChatDialog({
  open,
  onOpenChange,
  onGroupCreated,
}: GroupChatDialogProps) {
  const { user } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      const [teachers, students, parents, admins] = await Promise.all([
        supabase.from("teachers").select("teacher_id, full_name").eq("status", "active"),
        supabase.from("students").select("student_id, full_name").eq("status", "active"),
        supabase.from("parents").select("parent_id, full_name").eq("status", "active"),
        supabase.from("admins").select("admin_id, full_name").eq("status", "active"),
      ]);

      const allUsers: User[] = [
        ...(teachers.data?.map((t) => ({ id: t.teacher_id, name: t.full_name, role: "Teacher" })) || []),
        ...(students.data?.map((s) => ({ id: s.student_id, name: s.full_name, role: "Student" })) || []),
        ...(parents.data?.map((p) => ({ id: p.parent_id, name: p.full_name, role: "Parent" })) || []),
        ...(admins.data?.map((a) => ({ id: a.admin_id, name: a.full_name, role: "Admin" })) || []),
      ];

      setUsers(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (selectedUsers.length < 2) {
      toast.error("Please select at least 2 participants");
      return;
    }

    setLoading(true);
    try {
      const conversationId = crypto.randomUUID();

      // Create initial group message
      const { error: messageError } = await supabase.from("messages").insert({
        sender_id: user?.id,
        receiver_id: selectedUsers[0],
        message_text: `Group "${groupName}" created`,
        conversation_id: conversationId,
        is_group: true,
        group_name: groupName,
        school_id: user?.user_metadata?.school_id,
        message_type: "text",
      });

      if (messageError) throw messageError;

      // Add all participants
      const participants = [user?.id, ...selectedUsers].map((userId) => ({
        conversation_id: conversationId,
        user_id: userId,
      }));

      const { error: participantError } = await supabase
        .from("conversation_participants")
        .insert(participants);

      if (participantError) throw participantError;

      toast.success("Group chat created successfully");
      onGroupCreated();
      onOpenChange(false);
      setGroupName("");
      setSelectedUsers([]);
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group chat");
    } finally {
      setLoading(false);
    }
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Group Chat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name</Label>
            <Input
              id="group-name"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Select Participants ({selectedUsers.length} selected)</Label>
            <ScrollArea className="h-[300px] border rounded-lg p-4">
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={user.id}
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleUser(user.id)}
                    />
                    <label
                      htmlFor={user.id}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.role}
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateGroup} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
