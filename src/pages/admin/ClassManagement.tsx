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
import { School, Edit, Trash2, Plus, BookOpen } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

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

interface Subject {
  subject_id: string;
  subject_name: string;
  teacher_id: string | null;
  teacher_name: string;
}

export default function ClassManagement() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSchoolId, setCurrentSchoolId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({
    class_name: "",
    section: "",
    class_teacher_id: "",
  });
  
  const [subjectsDialogOpen, setSubjectsDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectFormData, setSubjectFormData] = useState({
    subject_name: "",
    teacher_id: "",
  });
  const [deleteSubjectDialogOpen, setDeleteSubjectDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Try to get admin data first
      let schoolId: string | null = null;
      
      const { data: adminData } = await supabase
        .from("admins")
        .select("school_id, admin_id")
        .eq("auth_user_id", user?.id)
        .maybeSingle();

      if (adminData?.school_id) {
        schoolId = adminData.school_id;
      } else {
        // Check if user is super admin - if so, get first school or show all
        const { data: superAdminData } = await supabase
          .from("super_admins")
          .select("super_admin_id")
          .eq("auth_user_id", user?.id)
          .maybeSingle();

        if (superAdminData) {
          // Super admin - get the first school for now
          const { data: schoolData } = await supabase
            .from("schools")
            .select("school_id")
            .limit(1)
            .maybeSingle();
          
          if (schoolData) {
            schoolId = schoolData.school_id;
          }
        }
      }

      if (!schoolId) {
        toast.error("Unable to find your school information");
        setLoading(false);
        return;
      }

      // Store school ID for later use
      setCurrentSchoolId(schoolId);

      // Fetch all data in parallel
      const [classesRes, teachersRes] = await Promise.all([
        supabase
          .from("classes")
          .select("class_id, class_name, section, class_teacher_id, school_id")
          .eq("school_id", schoolId),
        supabase
          .from("teachers")
          .select("teacher_id, full_name, email, status")
          .eq("school_id", schoolId)
          .eq("status", "active")
      ]);

      if (classesRes.error) {
        console.error("Error fetching classes:", classesRes.error);
        toast.error(`Failed to load classes: ${classesRes.error.message}`);
      }

      if (teachersRes.error) {
        console.error("Error fetching teachers:", teachersRes.error);
        toast.error(`Failed to load teachers: ${teachersRes.error.message}`);
      }

      // Create a map of teacher_id to teacher name
      const teacherMap = new Map<string, string>();
      if (teachersRes.data) {
        teachersRes.data.forEach((teacher: any) => {
          teacherMap.set(teacher.teacher_id, teacher.full_name);
        });
      }

      // Format classes with teacher names
      if (classesRes.data) {
        const formattedClasses = classesRes.data.map((c: any) => ({
          class_id: c.class_id,
          class_name: c.class_name,
          section: c.section || "",
          class_teacher_id: c.class_teacher_id,
          teacher_name: c.class_teacher_id 
            ? (teacherMap.get(c.class_teacher_id) || "Not Assigned")
            : "Not Assigned",
        }));
        setClasses(formattedClasses);
      } else {
        setClasses([]);
      }

      // Format teachers for dropdown
      if (teachersRes.data) {
        const formattedTeachers = teachersRes.data.map((teacher: any) => ({
          teacher_id: teacher.teacher_id,
          full_name: teacher.full_name,
        }));
        setTeachers(formattedTeachers);
      } else {
        setTeachers([]);
        console.warn("No active teachers found for school");
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
      if (!currentSchoolId) {
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
          .eq("school_id", currentSchoolId);

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
            school_id: currentSchoolId,
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
      if (!currentSchoolId) {
        toast.error("Unable to find your school information");
        return;
      }

      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("class_id", editingClass.class_id)
        .eq("school_id", currentSchoolId);

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
    setFormData({ class_name: "", section: "", class_teacher_id: "" });
  };

  const handleManageSubjects = async (classData: Class) => {
    setSelectedClass(classData);
    setSubjectsDialogOpen(true);
    // Re-fetch teachers to ensure fresh data
    await fetchData();
    await fetchSubjects(classData.class_id);
  };

  const fetchSubjects = async (classId: string) => {
    try {
      const { data: subjectsData, error } = await supabase
        .from("subjects")
        .select("subject_id, subject_name, teacher_id")
        .eq("class_id", classId);

      if (error) {
        console.error("Error fetching subjects:", error);
        toast.error("Failed to load subjects");
        return;
      }

      const teacherMap = new Map<string, string>();
      teachers.forEach((t) => {
        teacherMap.set(t.teacher_id, t.full_name);
      });

      const formattedSubjects = (subjectsData || []).map((s) => ({
        subject_id: s.subject_id,
        subject_name: s.subject_name,
        teacher_id: s.teacher_id,
        teacher_name: s.teacher_id ? (teacherMap.get(s.teacher_id) || "Not Assigned") : "Not Assigned",
      }));

      setSubjects(formattedSubjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      toast.error("Failed to load subjects");
    }
  };

  const handleSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClass) return;

    try {
      if (!subjectFormData.subject_name.trim()) {
        toast.error("Subject name is required");
        return;
      }

      const teacherId = subjectFormData.teacher_id === "none" ? null : subjectFormData.teacher_id;

      if (editingSubject) {
        const { error } = await supabase
          .from("subjects")
          .update({
            subject_name: subjectFormData.subject_name.trim(),
            teacher_id: teacherId,
          })
          .eq("subject_id", editingSubject.subject_id);

        if (error) {
          console.error("Error updating subject:", error);
          toast.error("Failed to update subject");
          return;
        }
        toast.success("Subject updated successfully");
      } else {
        const { error } = await supabase
          .from("subjects")
          .insert({
            subject_name: subjectFormData.subject_name.trim(),
            teacher_id: teacherId,
            class_id: selectedClass.class_id,
          });

        if (error) {
          console.error("Error creating subject:", error);
          toast.error("Failed to create subject");
          return;
        }
        toast.success("Subject created successfully");
      }

      await fetchSubjects(selectedClass.class_id);
      handleSubjectDialogClose();
    } catch (error: any) {
      console.error("Error saving subject:", error);
      toast.error(error.message || "Failed to save subject");
    }
  };

  const handleDeleteSubject = async () => {
    if (!editingSubject || !selectedClass) return;

    try {
      const { error } = await supabase
        .from("subjects")
        .delete()
        .eq("subject_id", editingSubject.subject_id);

      if (error) {
        console.error("Error deleting subject:", error);
        toast.error("Failed to delete subject");
        return;
      }

      toast.success("Subject deleted successfully");
      await fetchSubjects(selectedClass.class_id);
      setDeleteSubjectDialogOpen(false);
      setEditingSubject(null);
    } catch (error: any) {
      console.error("Error deleting subject:", error);
      toast.error(error.message || "Failed to delete subject");
    }
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setSubjectFormData({
      subject_name: subject.subject_name,
      teacher_id: subject.teacher_id || "none",
    });
    setSubjectDialogOpen(true);
  };

  const handleSubjectDialogClose = () => {
    setSubjectDialogOpen(false);
    setEditingSubject(null);
    setSubjectFormData({ subject_name: "", teacher_id: "" });
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
                <TableHead>Subjects</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
                      <Button size="sm" variant="outline" onClick={() => handleManageSubjects(classData)}>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Manage Subjects
                      </Button>
                    </TableCell>
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
              <Select 
                value={formData.class_teacher_id || "none"} 
                onValueChange={(v) => setFormData({ ...formData, class_teacher_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Teacher" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="none">None</SelectItem>
                  {teachers.length === 0 ? (
                    <SelectItem value="no-teachers" disabled>
                      No active teachers available
                    </SelectItem>
                  ) : (
                    teachers.map((t) => (
                      <SelectItem key={t.teacher_id} value={t.teacher_id}>
                        {t.full_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {teachers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No active teachers found. Please add teachers first.
                </p>
              )}
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

      <Dialog open={subjectsDialogOpen} onOpenChange={setSubjectsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Manage Subjects - {selectedClass?.class_name} {selectedClass?.section}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Badge variant="secondary">{subjects.length} Subjects</Badge>
              <Button size="sm" onClick={() => setSubjectDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Subject
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject Name</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No subjects added yet. Click "Add Subject" to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  subjects.map((subject) => (
                    <TableRow key={subject.subject_id}>
                      <TableCell>{subject.subject_name}</TableCell>
                      <TableCell>{subject.teacher_name}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEditSubject(subject)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setEditingSubject(subject);
                              setDeleteSubjectDialogOpen(true);
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
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={subjectDialogOpen} onOpenChange={handleSubjectDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubjectSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject_name">Subject Name *</Label>
              <Input
                id="subject_name"
                value={subjectFormData.subject_name}
                onChange={(e) => setSubjectFormData({ ...subjectFormData, subject_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher_id">Teacher</Label>
              <Select 
                value={subjectFormData.teacher_id || "none"} 
                onValueChange={(v) => setSubjectFormData({ ...subjectFormData, teacher_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Teacher" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="none">None</SelectItem>
                  {teachers.length === 0 ? (
                    <SelectItem value="no-teachers" disabled>
                      No active teachers available
                    </SelectItem>
                  ) : (
                    teachers.map((t) => (
                      <SelectItem key={t.teacher_id} value={t.teacher_id}>
                        {t.full_name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {teachers.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No active teachers found. Please add teachers first.
                </p>
              )}
            </div>
            <Button type="submit">{editingSubject ? "Update" : "Create"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteSubjectDialogOpen} onOpenChange={setDeleteSubjectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subject? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSubject}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
