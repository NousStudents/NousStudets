import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Users } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function WhitelistedParentsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch school_id for current admin
  const { data: adminData } = useQuery({
    queryKey: ["currentAdmin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("admins")
        .select("school_id")
        .eq("auth_user_id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });
  
  const [newParent, setNewParent] = useState({
    email: "",
    full_name: "",
    phone: "",
    relation: "father",
    student_ids: [] as string[],
  });

  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const { data: students } = useQuery({
    queryKey: ["students-for-parent-link", adminData?.school_id],
    queryFn: async () => {
      if (!adminData?.school_id) return [];
      const { data, error } = await supabase
        .from("students")
        .select("student_id, full_name, email, class_id, classes(class_name, section)")
        .eq("classes.school_id", adminData.school_id)
        .order("full_name");
      
      if (error) throw error;
      return data;
    },
    enabled: !!adminData?.school_id,
  });

  const { data: whitelistedParents, isLoading } = useQuery({
    queryKey: ["whitelisted-parents", adminData?.school_id],
    queryFn: async () => {
      if (!adminData?.school_id) return [];
      const { data, error } = await supabase
        .from("whitelisted_parents")
        .select("*")
        .eq("school_id", adminData.school_id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!adminData?.school_id,
  });

  const addMutation = useMutation({
    mutationFn: async (parent: typeof newParent) => {
      if (!adminData?.school_id) throw new Error("No school selected");
      if (selectedStudents.length === 0) {
        throw new Error("Please select at least one student");
      }
      
      const { error } = await supabase
        .from("whitelisted_parents")
        .insert([{ 
          ...parent,
          student_ids: selectedStudents,
          school_id: adminData.school_id,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Parent whitelisted successfully" });
      queryClient.invalidateQueries({ queryKey: ["whitelisted-parents"] });
      setNewParent({
        email: "",
        full_name: "",
        phone: "",
        relation: "father",
        student_ids: [],
      });
      setSelectedStudents([]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("whitelisted_parents")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Parent removed from whitelist" });
      queryClient.invalidateQueries({ queryKey: ["whitelisted-parents"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAdd = () => {
    if (!newParent.email || !newParent.full_name) {
      toast({
        title: "Required fields missing",
        description: "Email and full name are required",
        variant: "destructive",
      });
      return;
    }
    addMutation.mutate(newParent);
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Whitelist Parents</h1>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Add New Parent</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Email *"
              type="email"
              value={newParent.email}
              onChange={(e) => setNewParent({ ...newParent, email: e.target.value })}
            />
            <Input
              placeholder="Full Name *"
              value={newParent.full_name}
              onChange={(e) => setNewParent({ ...newParent, full_name: e.target.value })}
            />
            <Input
              placeholder="Phone"
              value={newParent.phone}
              onChange={(e) => setNewParent({ ...newParent, phone: e.target.value })}
            />
            <Select
              value={newParent.relation}
              onValueChange={(value) => setNewParent({ ...newParent, relation: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Relation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="father">Father</SelectItem>
                <SelectItem value="mother">Mother</SelectItem>
                <SelectItem value="guardian">Guardian</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Select Students *</label>
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
              {students && students.length > 0 ? (
                students.map((student) => (
                  <label
                    key={student.student_id}
                    className="flex items-center space-x-2 p-2 hover:bg-accent rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.student_id)}
                      onChange={() => toggleStudent(student.student_id)}
                      className="rounded"
                    />
                    <span className="text-sm">
                      {student.full_name} - {student.email}
                    </span>
                  </label>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No students available</p>
              )}
            </div>
          </div>
        </div>
        <Button 
          onClick={handleAdd} 
          className="mt-4"
          disabled={addMutation.isPending}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Parent
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Whitelisted Parents</h2>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : whitelistedParents && whitelistedParents.length > 0 ? (
          <div className="space-y-2">
            {whitelistedParents.map((parent) => (
              <div
                key={parent.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <p className="font-medium">{parent.full_name}</p>
                  <p className="text-sm text-muted-foreground">{parent.email}</p>
                  {parent.relation && (
                    <p className="text-sm text-muted-foreground capitalize">Relation: {parent.relation}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Linked Students: {parent.student_ids?.length || 0}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteMutation.mutate(parent.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No whitelisted parents yet</p>
        )}
      </Card>
    </div>
  );
}
