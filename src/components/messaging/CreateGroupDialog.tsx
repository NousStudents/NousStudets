import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SchoolUser {
  user_id: string;
  full_name: string;
  role: string;
  email: string;
  profile_image?: string;
}

interface CreateGroupDialogProps {
  currentUserId: string;
  schoolId: string;
  schoolUsers: SchoolUser[];
  onGroupCreated: () => void;
}

export function CreateGroupDialog({ currentUserId, schoolId, schoolUsers, onGroupCreated }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchClasses();
    }
  }, [open, schoolId]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("class_id, class_name, section")
        .eq("school_id", schoolId)
        .order("class_name");

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const selectAllFromClass = async (classId: string) => {
    try {
      const { data: students, error } = await supabase
        .from("students")
        .select("student_id")
        .eq("class_id", classId);

      if (error) throw error;

      const studentIds = students?.map(s => s.student_id) || [];
      setSelectedMembers(prev => {
        const newSet = new Set([...prev, ...studentIds]);
        return Array.from(newSet);
      });
      
      setSelectedClass(classId);
      toast.success(`Added all students from class`);
    } catch (error) {
      console.error("Error selecting class:", error);
      toast.error("Failed to select class");
    }
  };

  const createGroup = async () => {
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member");
      return;
    }

    setCreating(true);
    try {
      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({
          name: groupName,
          description: groupDescription,
          is_group: true,
          school_id: schoolId,
          created_by: currentUserId,
        })
        .select()
        .single();

      if (convError) throw convError;

      // Add participants (including creator)
      const participants = [
        { conversation_id: conversation.conversation_id, user_id: currentUserId, role: "admin" },
        ...selectedMembers.map(userId => ({
          conversation_id: conversation.conversation_id,
          user_id: userId,
          role: "member"
        }))
      ];

      const { error: participantsError } = await supabase
        .from("conversation_participants")
        .insert(participants);

      if (participantsError) throw participantsError;

      toast.success("Group created successfully!");
      setOpen(false);
      setGroupName("");
      setGroupDescription("");
      setSelectedMembers([]);
      setSelectedClass(null);
      onGroupCreated();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group");
    } finally {
      setCreating(false);
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

  const students = schoolUsers.filter(u => u.role === "student");
  const teachers = schoolUsers.filter(u => u.role === "teacher");
  const admins = schoolUsers.filter(u => u.role === "admin");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Group Chat
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              placeholder="e.g., Class 10-A, Math Study Group"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="groupDescription">Description (Optional)</Label>
            <Input
              id="groupDescription"
              placeholder="Brief description of the group"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="mb-2 block">Add Members ({selectedMembers.length} selected)</Label>
            
            <Tabs defaultValue="students" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="classes">By Class</TabsTrigger>
                <TabsTrigger value="staff">Staff</TabsTrigger>
              </TabsList>

              <TabsContent value="students" className="mt-2">
                <ScrollArea className="h-64 border rounded-lg p-2">
                  {students.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center p-4">No students found</p>
                  ) : (
                    <div className="space-y-2">
                      {students.map((user) => (
                        <div
                          key={user.user_id}
                          className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg cursor-pointer"
                          onClick={() => toggleMember(user.user_id)}
                        >
                          <Checkbox
                            checked={selectedMembers.includes(user.user_id)}
                            onCheckedChange={() => toggleMember(user.user_id)}
                          />
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(user.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="classes" className="mt-2">
                <ScrollArea className="h-64 border rounded-lg p-2">
                  {classes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center p-4">No classes found</p>
                  ) : (
                    <div className="space-y-2">
                      {classes.map((classItem) => (
                        <button
                          key={classItem.class_id}
                          onClick={() => selectAllFromClass(classItem.class_id)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-colors ${
                            selectedClass === classItem.class_id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium">
                                {classItem.class_name}
                                {classItem.section && ` - ${classItem.section}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Click to add all students
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="staff" className="mt-2">
                <ScrollArea className="h-64 border rounded-lg p-2">
                  <div className="space-y-4">
                    {teachers.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Teachers</p>
                        {teachers.map((user) => (
                          <div
                            key={user.user_id}
                            className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg cursor-pointer"
                            onClick={() => toggleMember(user.user_id)}
                          >
                            <Checkbox
                              checked={selectedMembers.includes(user.user_id)}
                              onCheckedChange={() => toggleMember(user.user_id)}
                            />
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{user.full_name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {admins.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Admins</p>
                        {admins.map((user) => (
                          <div
                            key={user.user_id}
                            className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg cursor-pointer"
                            onClick={() => toggleMember(user.user_id)}
                          >
                            <Checkbox
                              checked={selectedMembers.includes(user.user_id)}
                              onCheckedChange={() => toggleMember(user.user_id)}
                            />
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(user.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{user.full_name}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={createGroup} disabled={creating}>
              {creating ? "Creating..." : "Create Group"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
