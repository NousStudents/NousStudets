import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { Users, Edit, Trash2, Filter, CheckSquare, Download, TrendingUp } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { EditStudentDialog } from "@/components/admin/EditStudentDialog";

interface Student {
  student_id: string;
  auth_user_id: string;
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
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [bulkAssignClassOpen, setBulkAssignClassOpen] = useState(false);
  const [bulkPromoteOpen, setBulkPromoteOpen] = useState(false);
  const [bulkTargetClassId, setBulkTargetClassId] = useState<string>("");
  
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
      console.log("Fetching student data...");
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("school_id")
        .eq("auth_user_id", user?.id)
        .single();

      console.log("Admin data:", adminData, "Error:", adminError);

      if (!adminData?.school_id) {
        console.log("No school_id found for user");
        toast.error("School information not found");
        setLoading(false);
        return;
      }

      // Fetch classes first
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .eq("school_id", adminData.school_id);

      if (classesError) {
        console.error("Classes query error:", classesError);
        toast.error(`Failed to fetch classes: ${classesError.message}`);
        setLoading(false);
        return;
      }

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*");

      console.log("Students query result:", studentsData, "Error:", studentsError);

      if (studentsError) {
        console.error("Students query error:", studentsError);
        toast.error(`Failed to fetch students: ${studentsError.message}`);
        setLoading(false);
        return;
      }

      if (studentsData && classesData) {
        // Create a map of classes for easy lookup
        const classMap = new Map(classesData.map(c => [c.class_id, c]));
        
        // Filter students by school and join with class data
        const studentsInSchool = studentsData
          .filter((s: any) => {
            const studentClass = classMap.get(s.class_id);
            return studentClass && studentClass.school_id === adminData.school_id;
          })
          .map((s: any) => {
            const studentClass = classMap.get(s.class_id);
            return {
              ...s,
              class_name: studentClass?.class_name || '',
              section: studentClass?.section || ''
            };
          });

        const formattedStudents = await Promise.all(
          studentsInSchool.map(async (s: any) => {
            let parent_name = "Not Assigned";
            if (s.parent_id) {
              const { data: parentData } = await supabase
                .from("parents")
                .select("full_name")
                .eq("parent_id", s.parent_id)
                .single();
              parent_name = parentData?.full_name || "Not Assigned";
            }

            return {
              student_id: s.student_id,
              auth_user_id: s.auth_user_id,
              full_name: s.full_name || "N/A",
              email: s.email || "N/A",
              phone: s.phone || "N/A",
              roll_no: s.roll_no || "N/A",
              class_id: s.class_id,
              class_name: s.class_name 
                ? `${s.class_name}${s.section ? ` (${s.section})` : ''}`
                : "Not Assigned",
              section: s.section || "",
              gender: s.gender || "",
              dob: s.dob || "",
              admission_date: s.admission_date || "",
              parent_name,
              parent_id: s.parent_id,
              status: s.status || "inactive",
            };
          })
        );
        console.log("Formatted students:", formattedStudents);
        setStudents(formattedStudents);
      } else {
        setStudents([]);
      }

      // Set classes state
      setClasses(classesData || []);
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
      // Delete student record (auth deletion handled by trigger)
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("student_id", selectedStudent.student_id);

      if (error) throw error;
      toast.success("Student deleted successfully");
      fetchData();
      setDeleteDialogOpen(false);
      setSelectedStudent(null);
    } catch (error: any) {
      toast.error(`Failed to delete student: ${error.message}`);
    }
  };

  const handleStatusToggle = async (student: Student) => {
    try {
      const newStatus = student.status === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("students")
        .update({ status: newStatus })
        .eq("student_id", student.student_id);

      if (error) throw error;
      toast.success(`Student ${newStatus === "active" ? "activated" : "deactivated"}`);
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update student status");
    }
  };

  const handleBulkActivate = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error("No students selected");
      return;
    }

    try {
      const { error } = await supabase
        .from("students")
        .update({ status: "active" })
        .in("student_id", selectedStudentIds);

      if (error) throw error;
      toast.success(`${selectedStudentIds.length} student(s) activated`);
      setSelectedStudentIds([]);
      fetchData();
    } catch (error: any) {
      toast.error(`Failed to activate students: ${error.message}`);
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error("No students selected");
      return;
    }

    try {
      const { error } = await supabase
        .from("students")
        .update({ status: "inactive" })
        .in("student_id", selectedStudentIds);

      if (error) throw error;
      toast.success(`${selectedStudentIds.length} student(s) deactivated`);
      setSelectedStudentIds([]);
      fetchData();
    } catch (error: any) {
      toast.error(`Failed to deactivate students: ${error.message}`);
    }
  };

  const handleBulkAssignClass = async () => {
    if (selectedStudentIds.length === 0 || !bulkTargetClassId) {
      toast.error("Please select students and a target class");
      return;
    }

    try {
      const { error } = await supabase
        .from("students")
        .update({ class_id: bulkTargetClassId })
        .in("student_id", selectedStudentIds);

      if (error) throw error;
      toast.success(`${selectedStudentIds.length} student(s) assigned to class`);
      setSelectedStudentIds([]);
      setBulkAssignClassOpen(false);
      setBulkTargetClassId("");
      fetchData();
    } catch (error: any) {
      toast.error(`Failed to assign class: ${error.message}`);
    }
  };

  const handleBulkPromote = async () => {
    if (selectedStudentIds.length === 0 || !bulkTargetClassId) {
      toast.error("Please select students and a target grade");
      return;
    }

    try {
      const { error } = await supabase
        .from("students")
        .update({ class_id: bulkTargetClassId })
        .in("student_id", selectedStudentIds);

      if (error) throw error;
      toast.success(`${selectedStudentIds.length} student(s) promoted to next grade`);
      setSelectedStudentIds([]);
      setBulkPromoteOpen(false);
      setBulkTargetClassId("");
      fetchData();
    } catch (error: any) {
      toast.error(`Failed to promote students: ${error.message}`);
    }
  };

  const handleExportCSV = () => {
    const csvData = filteredStudents.map(s => ({
      "Roll No": s.roll_no,
      "Name": s.full_name,
      "Email": s.email,
      "Class": s.class_name,
      "Section": s.section,
      "Gender": s.gender,
      "DOB": s.dob,
      "Admission Date": s.admission_date,
      "Status": s.status
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(","),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row] || ""}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `students_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Student list exported successfully");
  };

  const toggleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map(s => s.student_id));
    }
  };

  const toggleSelectStudent = (studentId: string) => {
    setSelectedStudentIds(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Students ({filteredStudents.length})</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filteredStudents.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {selectedStudentIds.length > 0 && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-medium">
                  {selectedStudentIds.length} student(s) selected
                </span>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkActivate}
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Activate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkDeactivate}
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Deactivate
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkAssignClassOpen(true)}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Assign Class
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkPromoteOpen(true)}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Promote
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedStudentIds([])}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
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
                  <TableCell>
                    <Checkbox
                      checked={selectedStudentIds.includes(student.student_id)}
                      onCheckedChange={() => toggleSelectStudent(student.student_id)}
                    />
                  </TableCell>
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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedStudent(student);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <EditStudentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        student={selectedStudent}
        onSuccess={fetchData}
        classes={classes}
      />

      {/* Delete Dialog */}
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

      {/* Bulk Assign Class Dialog */}
      <Dialog open={bulkAssignClassOpen} onOpenChange={setBulkAssignClassOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Assign Class</DialogTitle>
            <DialogDescription>
              Assign {selectedStudentIds.length} selected student(s) to a class
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target Class</Label>
              <Select value={bulkTargetClassId} onValueChange={setBulkTargetClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.class_id} value={c.class_id}>
                      {c.class_name} {c.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkAssignClassOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAssignClass}>Assign Class</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Promote Dialog */}
      <Dialog open={bulkPromoteOpen} onOpenChange={setBulkPromoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Promote to Next Grade</DialogTitle>
            <DialogDescription>
              Promote {selectedStudentIds.length} selected student(s) to the next grade
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target Grade/Class</Label>
              <Select value={bulkTargetClassId} onValueChange={setBulkTargetClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target grade" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.class_id} value={c.class_id}>
                      {c.class_name} {c.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              Note: This will move all selected students to the chosen grade/class. Make sure to select the appropriate next level class.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkPromoteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkPromote}>Promote Students</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
