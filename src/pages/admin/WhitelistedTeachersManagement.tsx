import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, BookOpen } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";

export default function WhitelistedTeachersManagement() {
  const { confirmDelete, DeleteConfirmationDialog } = useDeleteConfirmation({
    title: "Remove Teacher from Whitelist",
    description: "Are you sure you want to remove this teacher from the whitelist? They will no longer be able to sign up.",
  });
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
  
  const [newTeacher, setNewTeacher] = useState({
    email: "",
    full_name: "",
    department: "",
    subject_specialization: "",
    employee_id: "",
    phone: "",
  });

  const { data: whitelistedTeachers, isLoading } = useQuery({
    queryKey: ["whitelisted-teachers", adminData?.school_id],
    queryFn: async () => {
      if (!adminData?.school_id) return [];
      const { data, error } = await supabase
        .from("whitelisted_teachers")
        .select("*")
        .eq("school_id", adminData.school_id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!adminData?.school_id,
  });

  const addMutation = useMutation({
    mutationFn: async (teacher: typeof newTeacher) => {
      if (!adminData?.school_id) throw new Error("No school selected");
      
      const { error } = await supabase
        .from("whitelisted_teachers")
        .insert([{ 
          ...teacher, 
          school_id: adminData.school_id,
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Teacher whitelisted successfully" });
      queryClient.invalidateQueries({ queryKey: ["whitelisted-teachers"] });
      setNewTeacher({
        email: "",
        full_name: "",
        department: "",
        subject_specialization: "",
        employee_id: "",
        phone: "",
      });
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
        .from("whitelisted_teachers")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Teacher removed from whitelist" });
      queryClient.invalidateQueries({ queryKey: ["whitelisted-teachers"] });
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
    if (!newTeacher.email || !newTeacher.full_name) {
      toast({
        title: "Required fields missing",
        description: "Email and full name are required",
        variant: "destructive",
      });
      return;
    }
    addMutation.mutate(newTeacher);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">Whitelist Teachers</h1>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Add New Teacher</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Email *"
            type="email"
            value={newTeacher.email}
            onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })}
          />
          <Input
            placeholder="Full Name *"
            value={newTeacher.full_name}
            onChange={(e) => setNewTeacher({ ...newTeacher, full_name: e.target.value })}
          />
          <Input
            placeholder="Department"
            value={newTeacher.department}
            onChange={(e) => setNewTeacher({ ...newTeacher, department: e.target.value })}
          />
          <Input
            placeholder="Subject Specialization"
            value={newTeacher.subject_specialization}
            onChange={(e) => setNewTeacher({ ...newTeacher, subject_specialization: e.target.value })}
          />
          <Input
            placeholder="Employee ID"
            value={newTeacher.employee_id}
            onChange={(e) => setNewTeacher({ ...newTeacher, employee_id: e.target.value })}
          />
          <Input
            placeholder="Phone"
            value={newTeacher.phone}
            onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
          />
        </div>
        <Button 
          onClick={handleAdd} 
          className="mt-4"
          disabled={addMutation.isPending}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Teacher
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Whitelisted Teachers</h2>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : whitelistedTeachers && whitelistedTeachers.length > 0 ? (
          <div className="space-y-2">
            {whitelistedTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <p className="font-medium">{teacher.full_name}</p>
                  <p className="text-sm text-muted-foreground">{teacher.email}</p>
                  {teacher.department && (
                    <p className="text-sm text-muted-foreground">Department: {teacher.department}</p>
                  )}
                  {teacher.subject_specialization && (
                    <p className="text-sm text-muted-foreground">Subject: {teacher.subject_specialization}</p>
                  )}
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => confirmDelete(
                    () => deleteMutation.mutate(teacher.id),
                    `Are you sure you want to remove "${teacher.full_name}" from the whitelist?`
                  )}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No whitelisted teachers yet</p>
        )}
      </Card>
      
      <DeleteConfirmationDialog />
    </div>
  );
}
