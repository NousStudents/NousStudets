import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Trash2, UserPlus } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useDeleteConfirmation } from "@/hooks/useDeleteConfirmation";

export default function AllowedStudentsManagement() {
  const { confirmDelete, DeleteConfirmationDialog } = useDeleteConfirmation({
    title: "Remove Student from Whitelist",
    description: "Are you sure you want to remove this student from the whitelist? They will no longer be able to sign up.",
  });
  const queryClient = useQueryClient();
  const [newStudent, setNewStudent] = useState({
    email: "",
    fullName: "",
    classId: "",
    section: "",
    rollNo: "",
  });

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

  // Fetch classes for the school
  const { data: classes } = useQuery({
    queryKey: ["classes", adminData?.school_id],
    queryFn: async () => {
      if (!adminData?.school_id) return [];
      
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .eq("school_id", adminData.school_id)
        .order("class_name");
      
      if (error) throw error;
      return data;
    },
    enabled: !!adminData?.school_id,
  });

  // Fetch allowed students
  const { data: allowedStudents, isLoading } = useQuery({
    queryKey: ["allowedStudents", adminData?.school_id],
    queryFn: async () => {
      if (!adminData?.school_id) return [];
      
      const { data, error } = await supabase
        .from("allowed_students")
        .select(`
          *,
          classes:class_id (
            class_name,
            section
          )
        `)
        .eq("school_id", adminData.school_id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!adminData?.school_id,
  });

  // Add student mutation
  const addStudentMutation = useMutation({
    mutationFn: async (studentData: typeof newStudent) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("allowed_students")
        .insert({
          school_id: adminData?.school_id,
          email: studentData.email.toLowerCase().trim(),
          full_name: studentData.fullName,
          class_id: studentData.classId || null,
          section: studentData.section || null,
          roll_no: studentData.rollNo || null,
          created_by: user.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allowedStudents"] });
      toast.success("Student added to whitelist");
      setNewStudent({ email: "", fullName: "", classId: "", section: "", rollNo: "" });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add student");
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("allowed_students")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allowedStudents"] });
      toast.success("Student removed from whitelist");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove student");
    },
  });

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newStudent.email || !newStudent.fullName) {
      toast.error("Email and full name are required");
      return;
    }

    addStudentMutation.mutate(newStudent);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <BackButton />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Whitelist Students
          </CardTitle>
          <CardDescription>
            Add students who are allowed to sign up for your school
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                placeholder="Email"
                type="email"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                required
              />
              <Input
                placeholder="Full Name"
                value={newStudent.fullName}
                onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })}
                required
              />
              <Select
                value={newStudent.classId}
                onValueChange={(value) => {
                  const selected = classes?.find((c) => c.class_id === value);
                  setNewStudent({ 
                    ...newStudent, 
                    classId: value, 
                    section: selected?.section || "" 
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Class (Optional)" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls) => (
                    <SelectItem key={cls.class_id} value={cls.class_id}>
                      {cls.class_name} - {cls.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Section"
                value={newStudent.section}
                onChange={(e) => setNewStudent({ ...newStudent, section: e.target.value })}
                disabled={!!newStudent.classId}
              />
              <Input
                placeholder="Roll Number (Optional)"
                value={newStudent.rollNo}
                onChange={(e) => setNewStudent({ ...newStudent, rollNo: e.target.value })}
              />
              <Button type="submit" disabled={addStudentMutation.isPending}>
                {addStudentMutation.isPending ? "Adding..." : "Add Student"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Whitelisted Students</CardTitle>
          <CardDescription>
            Students who can create accounts for your school
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : allowedStudents?.length === 0 ? (
            <p className="text-muted-foreground">No students whitelisted yet</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allowedStudents?.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell>{student.classes?.class_name || "-"}</TableCell>
                      <TableCell>{student.section || "-"}</TableCell>
                      <TableCell>{student.roll_no || "-"}</TableCell>
                      <TableCell>{new Date(student.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => confirmDelete(
                            () => deleteStudentMutation.mutate(student.id),
                            `Are you sure you want to remove "${student.full_name}" from the whitelist?`
                          )}
                          disabled={deleteStudentMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <DeleteConfirmationDialog />
    </div>
  );
}