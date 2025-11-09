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
      const { data: userData } = await supabase
        .from("users")
        .select("school_id")
        .eq("auth_user_id", user?.id)
        .single();

      if (!userData?.school_id) return;

      const [classesRes, teachersRes] = await Promise.all([
        supabase
          .from("classes")
          .select(`
            class_id,
            class_name,
            section,
            class_teacher_id,
            teachers(teacher_id, users(full_name))
          `)
          .eq("school_id", userData.school_id),
        supabase
          .from("teachers")
          .select("teacher_id, users!inner(full_name, school_id)")
          .eq("users.school_id", userData.school_id)
      ]);

      if (classesRes.data) {
        const formattedClasses = classesRes.data.map((c: any) => ({
          class_id: c.class_id,
          class_name: c.class_name,
          section: c.section,
          class_teacher_id: c.class_teacher_id,
          teacher_name: c.teachers?.users?.full_name || "Not Assigned",
        }));
        setClasses(formattedClasses);
      }

      if (teachersRes.data) {
        const formattedTeachers = teachersRes.data.map((t: any) => ({
          teacher_id: t.teacher_id,
          full_name: t.users.full_name,
        }));
        setTeachers(formattedTeachers);
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
      const { data: userData } = await supabase
        .from("users")
        .select("school_id")
        .eq("auth_user_id", user?.id)
        .single();

      if (!userData?.school_id) return;

      if (editingClass) {
        const { error } = await supabase
          .from("classes")
          .update({
            class_name: formData.class_name,
            section: formData.section,
            class_teacher_id: formData.class_teacher_id || null,
          })
          .eq("class_id", editingClass.class_id);

        if (error) throw error;
        toast.success("Class updated successfully");
      } else {
        const { error } = await supabase
          .from("classes")
          .insert({
            class_name: formData.class_name,
            section: formData.section,
            class_teacher_id: formData.class_teacher_id || null,
            school_id: userData.school_id,
          });

        if (error) throw error;
        toast.success("Class created successfully");
      }

      fetchData();
      handleDialogClose();
    } catch (error) {
      console.error("Error saving class:", error);
      toast.error("Failed to save class");
    }
  };

  const handleDelete = async () => {
    if (!editingClass) return;

    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("class_id", editingClass.class_id);

      if (error) throw error;
      toast.success("Class deleted successfully");
      fetchData();
      setDeleteDialogOpen(false);
      setEditingClass(null);
    } catch (error) {
      console.error("Error deleting class:", error);
      toast.error("Failed to delete class");
    }
  };

  const handleEdit = (classData: Class) => {
    setEditingClass(classData);
    setFormData({
      class_name: classData.class_name,
      section: classData.section,
      class_teacher_id: classData.class_teacher_id || "",
    });
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingClass(null);
    setFormData({ class_name: "", section: "", class_teacher_id: "" });
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
              {classes.map((classData) => (
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
              ))}
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
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
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
