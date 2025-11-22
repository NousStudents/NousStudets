import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserMinus, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GroupMember {
  user_id: string;
  full_name: string;
  role: string;
  email: string;
  participant_role?: string;
}

interface GroupInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  groupName: string;
  groupDescription?: string;
  currentUserId: string;
  isCreator: boolean;
}

export function GroupInfoDialog({
  open,
  onOpenChange,
  conversationId,
  groupName,
  groupDescription,
  currentUserId,
  isCreator,
}: GroupInfoDialogProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open, conversationId]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const { data: participants, error } = await supabase
        .from("conversation_participants")
        .select("user_id, role")
        .eq("conversation_id", conversationId);

      if (error) throw error;

      // Fetch user details for all participants
      const userIds = participants?.map(p => p.user_id) || [];
      const memberDetails: GroupMember[] = [];

      // Fetch from all user tables
      const [admins, teachers, students, parents] = await Promise.all([
        supabase.from("admins").select("admin_id, full_name, email").in("admin_id", userIds),
        supabase.from("teachers").select("teacher_id, full_name, email").in("teacher_id", userIds),
        supabase.from("students").select("student_id, full_name, email").in("student_id", userIds),
        supabase.from("parents").select("parent_id, full_name, email").in("parent_id", userIds),
      ]);

      admins.data?.forEach(a => {
        const participant = participants?.find(p => p.user_id === a.admin_id);
        memberDetails.push({
          user_id: a.admin_id,
          full_name: a.full_name,
          email: a.email,
          role: "admin",
          participant_role: participant?.role,
        });
      });

      teachers.data?.forEach(t => {
        const participant = participants?.find(p => p.user_id === t.teacher_id);
        memberDetails.push({
          user_id: t.teacher_id,
          full_name: t.full_name,
          email: t.email,
          role: "teacher",
          participant_role: participant?.role,
        });
      });

      students.data?.forEach(s => {
        const participant = participants?.find(p => p.user_id === s.student_id);
        memberDetails.push({
          user_id: s.student_id,
          full_name: s.full_name,
          email: s.email,
          role: "student",
          participant_role: participant?.role,
        });
      });

      parents.data?.forEach(p => {
        const participant = participants?.find(part => part.user_id === p.parent_id);
        memberDetails.push({
          user_id: p.parent_id,
          full_name: p.full_name,
          email: p.email,
          role: "parent",
          participant_role: participant?.role,
        });
      });

      setMembers(memberDetails);
    } catch (error) {
      console.error("Error fetching members:", error);
      toast.error("Failed to load group members");
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (userId: string) => {
    if (!isCreator) {
      toast.error("Only group creators can remove members");
      return;
    }

    try {
      const { error } = await supabase
        .from("conversation_participants")
        .delete()
        .eq("conversation_id", conversationId)
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("Member removed from group");
      fetchMembers();
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Info
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-accent/50 rounded-lg p-4">
            <h3 className="font-semibold text-lg">{groupName}</h3>
            {groupDescription && (
              <p className="text-sm text-muted-foreground mt-1">{groupDescription}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {members.length} {members.length === 1 ? "member" : "members"}
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Members</h4>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading members...</p>
            ) : (
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.user_id}
                      className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{member.full_name}</p>
                          {member.participant_role === "admin" && (
                            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground capitalize">
                          {member.role}
                        </p>
                      </div>
                      {isCreator && member.user_id !== currentUserId && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeMember(member.user_id)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
