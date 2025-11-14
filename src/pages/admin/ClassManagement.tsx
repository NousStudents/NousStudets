import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { School, Edit, Trash2, Plus } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Class {
  class_id: string;
  class_name: string;
  section: string;
  class_teacher_id: string;
  teacher_name: string;
}

interface Teacher {
  teacher_id: string;
  full_name: string;
}

export default function ClassManagement() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    class_name: "",
    section: "",
    class_teacher_id: "",
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      console.log("Fetching user data for:", user?.id);
      
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("school_id, admin_id")
        .eq("auth_user_id", user?.id)
        .single();

      console.log("Admin data:", adminData);
      console.log("Admin error:", adminError);

      if (!adminData?.school_id) {
        console.error("No school_id found for user");
        toast.error("Unable to find your school information");
        setLoading(false);
        return;
      }

      // Fetch classes without the problematic join first
      console.log("Fetching classes for school_id:", adminData.school_id);
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("class_id, class_name, section, class_teacher_id, school_id")
        .eq("school_id", adminData.school_id);

      console.log("Classes data:", classesData);
      console.log("Classes error:", classesError);

      if (classesError) {
        console.error("Error fetching classes:", classesError);
        toast.error(`Failed to load classes: ${classesError.message}`);
      }

      // Fetch teachers separately
      console.log("Fetching teachers for school_id:", adminData.school_id);
      
      // Get all teachers for the school directly from teachers table
      const { data: allTeachersData, error: teachersError2 } = await supabase
        .from("teachers")
        .select("teacher_id, full_name, email")
        .eq("school_id", adminData.school_id);

      console.log("Teachers data:", allTeachersData);
      console.log("Teachers error:", teachersError2);

      if (teachersError2) {
        console.error("Error fetching teachers:", teachersError2);
      }

      // Create a map of teacher_id to teacher name
      const teacherMap = new Map<string, string>();
      if (allTeachersData) {
        allTeachersData.forEach((teacher: any) => {
          teacherMap.set(teacher.teacher_id, teacher.full_name);
        });
      }

      console.log("Teacher map:", Object.fromEntries(teacherMap));

      // Format classes with teacher names
      if (classesData) {
        const formattedClasses = classesData.map((c: any) => ({
          class_id: c.class_id,
          class_name: c.class_name,
          section: c.section || "",
          class_teacher_id: c.class_teacher_id,
          teacher_name: c.class_teacher_id 
            ? (teacherMap.get(c.class_teacher_id) || "Not Assigned")
            : "Not Assigned",
        }));
        console.log("Formatted classes:", formattedClasses);
        setClasses(formattedClasses);
      } else {
        setClasses([]);
      }

      // Format teachers for dropdown
      if (allTeachersData) {
        const formattedTeachers = allTeachersData.map((teacher: any) => ({
          teacher_id: teacher.teacher_id,
          full_name: teacher.full_name,
        }));
        console.log("Formatted teachers:", formattedTeachers);
        setTeachers(formattedTeachers);
      } else {
        setTeachers([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: adminData } = await supabase
        .from("admins")
        .select("school_id")
        .eq("auth_user_id", user?.id)
        .single();

      if (!adminData?.school_id) {
        toast.error("Unable to find your school information");
        return;
      }

      if (!formData.class_name.trim()) {
        toast.error("Class name is required");
        return;
      }

      const teacherId = formData.class_teacher_id === "none" ? null : formData.class_teacher_id;

      if (editingClass) {
        const { error } = await supabase
          .from("classes")
          .update({
            class_name: formData.class_name.trim(),
            section: formData.section.trim(),
            class_teacher_id: teacherId,
          })
          .eq("class_id", editingClass.class_id)
          .eq("school_id", adminData.school_id);

        if (error) {
          console.error("Error updating class:", error);
          if (error.message.includes("Teacher does not belong")) {
            toast.error("Selected teacher does not belong to your school");
          } else {
            toast.error(`Failed to update class: ${error.message}`);
          }
          return;
        }
        toast.success("Class updated successfully");
      } else {
        const { error } = await supabase
          .from("classes")
          .insert({
            class_name: formData.class_name.trim(),
            section: formData.section.trim(),
            class_teacher_id: teacherId,
            school_id: adminData.school_id,
          });

        if (error) {
          console.error("Error creating class:", error);
          if (error.message.includes("Teacher does not belong")) {
            toast.error("Selected teacher does not belong to your school");
          } else {
            toast.error(`Failed to create class: ${error.message}`);
          }
          return;
        }
        toast.success("Class created successfully");
      }

      fetchData();
      handleDialogClose();
    } catch (error: any) {
      console.error("Error saving class:", error);
      toast.error(error.message || "Failed to save class");
    }
  };

  const handleDelete = async () => {
    if (!editingClass) return;

    try {
      const { data: adminData } = await supabase
        .from("admins")
        .select("school_id")
        .eq("auth_user_id", user?.id)
        .single();

      if (!adminData?.school_id) {
        toast.error("Unable to find your school information");
        return;
      }

      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("class_id", editingClass.class_id)
        .eq("school_id", adminData.school_id);

      if (error) {
        console.error("Error deleting class:", error);
        toast.error(`Failed to delete class: ${error.message}`);
        return;
      }
      
      toast.success("Class deleted successfully");
      fetchData();
      setDeleteDialogOpen(false);
      setEditingClass(null);
    } catch (error: any) {
      console.error("Error deleting class:", error);
      toast.error(error.message || "Failed to delete class");
    }
  };

  const handleEdit = (classData: Class) => {
    setEditingClass(classData);
    setFormData({
      class_name: classData.class_name,
      section: classData.section,
      class_teacher_id: classData.class_teacher_id || "none",
    });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingClass(null);
    setFormData({ class_name: "", section: "", class_teacher_id: "none" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <BackButton />
      <div className="flex items-center justify-between mb-6 mt-4">
        <div className="flex items-center gap-3">
          <School className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Class Management</h1>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Class
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Classes ({classes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class Name</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Class Teacher</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No classes found. Click "Add Class" to create your first class.
                  </TableCell>
                </TableRow>
              ) : (
                classes.map((classData) => (
                  <TableRow key={classData.class_id}>
                    <TableCell>{classData.class_name}</TableCell>
                    <TableCell>{classData.section}</TableCell>
                    <TableCell>{classData.teacher_name}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(classData)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setEditingClass(classData);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClass ? "Edit Class" : "Add New Class"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="class_name">Class Name *</Label>
              <Input
                id="class_name"
                value={formData.class_name}
                onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Input
                id="section"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class_teacher_id">Class Teacher</Label>
              <Select value={formData.class_teacher_id} onValueChange={(v) => setFormData({ ...formData, class_teacher_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Teacher" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="none">None</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.teacher_id} value={t.teacher_id}>
                      {t.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">{editingClass ? "Update" : "Create"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this class? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
