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
import { Users, Edit, Trash2, Plus, Filter } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Student {
  student_id: string;
  user_id: string;
  full_name: string;
  email: string;
  roll_no: string;
  class_id: string;
  class_name: string;
  section: string;
  gender: string;
  dob: string;
  admission_date: string;
  status: string;
}

interface Class {
  class_id: string;
  class_name: string;
  section: string;
}

export default function StudentManagement() {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [filters, setFilters] = useState({
    classId: "all",
    section: "all",
    gender: "all",
    status: "all",
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

      const [studentsRes, classesRes] = await Promise.all([
        supabase
          .from("students")
          .select(`
            student_id,
            user_id,
            roll_no,
            section,
            gender,
            dob,
            admission_date,
            class_id,
            users!inner(full_name, email, status, school_id),
            classes!inner(class_name, school_id)
          `)
          .eq("users.school_id", userData.school_id),
        supabase
          .from("classes")
          .select("class_id, class_name, section")
          .eq("school_id", userData.school_id)
      ]);

      if (studentsRes.data) {
        const formattedStudents = studentsRes.data.map((s: any) => ({
          student_id: s.student_id,
          user_id: s.user_id,
          full_name: s.users.full_name,
          email: s.users.email,
          roll_no: s.roll_no,
          class_id: s.class_id,
          class_name: s.classes.class_name,
          section: s.section,
          gender: s.gender,
          dob: s.dob,
          admission_date: s.admission_date,
          status: s.users.status,
        }));
        setStudents(formattedStudents);
      }

      if (classesRes.data) {
        setClasses(classesRes.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;

    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("student_id", selectedStudent.student_id);

      if (error) throw error;
      toast.success("Student deleted successfully");
      fetchData();
      setDeleteDialogOpen(false);
      setSelectedStudent(null);
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error("Failed to delete student");
    }
  };

  const handleStatusToggle = async (student: Student) => {
    try {
      const newStatus = student.status === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("users")
        .update({ status: newStatus })
        .eq("user_id", student.user_id);

      if (error) throw error;
      toast.success(`Student ${newStatus === "active" ? "activated" : "deactivated"}`);
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update student status");
    }
  };

  const filteredStudents = students.filter((s) => {
    if (filters.classId && filters.classId !== "all" && s.class_id !== filters.classId) return false;
    if (filters.section && filters.section !== "all" && s.section !== filters.section) return false;
    if (filters.gender && filters.gender !== "all" && s.gender !== filters.gender) return false;
    if (filters.status && filters.status !== "all" && s.status !== filters.status) return false;
    return true;
  });

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
          <Users className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Student Management</h1>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={filters.classId} onValueChange={(v) => setFilters({ ...filters, classId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Classes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((c) => (
                    <SelectItem key={c.class_id} value={c.class_id}>
                      {c.class_name} {c.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={filters.gender} onValueChange={(v) => setFilters({ ...filters, gender: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => setFilters({ classId: "all", section: "all", gender: "all", status: "all" })}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Students ({filteredStudents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.student_id}>
                  <TableCell>{student.roll_no}</TableCell>
                  <TableCell>{student.full_name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.class_name} {student.section}</TableCell>
                  <TableCell>{student.gender}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={student.status === "active" ? "default" : "secondary"}
                      onClick={() => handleStatusToggle(student)}
                    >
                      {student.status}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedStudent(student);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedStudent?.full_name}? This action cannot be undone.
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
