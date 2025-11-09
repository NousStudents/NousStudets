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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { UserCheck, Edit, Trash2, Filter, Calendar, BookOpen } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Teacher {
  teacher_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  qualification: string;
  experience: number;
  status: string;
  subjects: string[];
}

interface Subject {
  subject_id: string;
  subject_name: string;
  class_name: string;
}

interface Schedule {
  timetable_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  class_name: string;
  subject_name: string;
}

export default function TeacherManagement() {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subjectsDialogOpen, setSubjectsDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [teacherSchedule, setTeacherSchedule] = useState<Schedule[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  
  const [filters, setFilters] = useState({
    qualification: "all",
    minExperience: "",
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

      if (!userData?.school_id) {
        toast.error("School information not found");
        setLoading(false);
        return;
      }

      // Fetch teachers with their user information
      const { data: teachersData, error: teachersError } = await supabase
        .from("teachers")
        .select(`
          teacher_id,
          user_id,
          qualification,
          experience,
          users!inner (
            full_name,
            email,
            phone,
            status,
            school_id
          )
        `)
        .eq("users.school_id", userData.school_id);

      if (teachersError) {
        console.error("Teachers query error:", teachersError);
        toast.error(`Failed to fetch teachers: ${teachersError.message}`);
      }

      // Fetch all subjects to show which subjects each teacher teaches
      const { data: subjectsData, error: subjectsError } = await supabase
        .from("subjects")
        .select(`
          subject_id,
          subject_name,
          teacher_id,
          classes (
            class_name
          )
        `)
        .eq("classes.school_id", userData.school_id);

      if (subjectsError) {
        console.error("Subjects query error:", subjectsError);
      }

      // Create a map of teacher_id to their subjects
      const teacherSubjectsMap = new Map<string, string[]>();
      const formattedSubjects: Subject[] = [];

      if (subjectsData) {
        subjectsData.forEach((s: any) => {
          if (s.teacher_id) {
            const subjects = teacherSubjectsMap.get(s.teacher_id) || [];
            subjects.push(s.subject_name);
            teacherSubjectsMap.set(s.teacher_id, subjects);
          }
          formattedSubjects.push({
            subject_id: s.subject_id,
            subject_name: s.subject_name,
            class_name: s.classes?.class_name || "N/A",
          });
        });
      }

      setAllSubjects(formattedSubjects);

      if (teachersData) {
        const formattedTeachers = teachersData.map((t: any) => ({
          teacher_id: t.teacher_id,
          user_id: t.user_id,
          full_name: t.users?.full_name || "N/A",
          email: t.users?.email || "N/A",
          phone: t.users?.phone || "N/A",
          qualification: t.qualification || "N/A",
          experience: t.experience || 0,
          status: t.users?.status || "inactive",
          subjects: teacherSubjectsMap.get(t.teacher_id) || [],
        }));
        setTeachers(formattedTeachers);
      } else {
        setTeachers([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load teachers");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherSchedule = async (teacherId: string) => {
    try {
      const { data, error } = await supabase
        .from("timetable")
        .select(`
          timetable_id,
          day_of_week,
          start_time,
          end_time,
          classes (
            class_name
          ),
          subjects (
            subject_name
          )
        `)
        .eq("teacher_id", teacherId)
        .order("day_of_week")
        .order("start_time");

      if (error) {
        console.error("Schedule query error:", error);
        toast.error("Failed to load schedule");
        return;
      }

      const formattedSchedule = (data || []).map((s: any) => ({
        timetable_id: s.timetable_id,
        day_of_week: s.day_of_week,
        start_time: s.start_time,
        end_time: s.end_time,
        class_name: s.classes?.class_name || "N/A",
        subject_name: s.subjects?.subject_name || "N/A",
      }));

      setTeacherSchedule(formattedSchedule);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      toast.error("Failed to load schedule");
    }
  };

  const handleViewSchedule = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    await fetchTeacherSchedule(teacher.teacher_id);
    setScheduleDialogOpen(true);
  };

  const handleManageSubjects = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    
    // Get current subject IDs for this teacher
    const { data, error } = await supabase
      .from("subjects")
      .select("subject_id")
      .eq("teacher_id", teacher.teacher_id);

    if (!error && data) {
      setSelectedSubjects(data.map(s => s.subject_id));
    } else {
      setSelectedSubjects([]);
    }
    
    setSubjectsDialogOpen(true);
  };

  const handleSaveSubjects = async () => {
    if (!selectedTeacher) return;

    try {
      // First, unassign all subjects from this teacher
      const { error: unassignError } = await supabase
        .from("subjects")
        .update({ teacher_id: null })
        .eq("teacher_id", selectedTeacher.teacher_id);

      if (unassignError) throw unassignError;

      // Then, assign selected subjects to this teacher
      if (selectedSubjects.length > 0) {
        const { error: assignError } = await supabase
          .from("subjects")
          .update({ teacher_id: selectedTeacher.teacher_id })
          .in("subject_id", selectedSubjects);

        if (assignError) throw assignError;
      }

      toast.success("Subjects assigned successfully");
      fetchData();
      setSubjectsDialogOpen(false);
    } catch (error) {
      console.error("Error assigning subjects:", error);
      toast.error("Failed to assign subjects");
    }
  };

  const handleDelete = async () => {
    if (!selectedTeacher) return;

    try {
      const { error } = await supabase
        .from("teachers")
        .delete()
        .eq("teacher_id", selectedTeacher.teacher_id);

      if (error) throw error;
      toast.success("Teacher deleted successfully");
      fetchData();
      setDeleteDialogOpen(false);
      setSelectedTeacher(null);
    } catch (error) {
      console.error("Error deleting teacher:", error);
      toast.error("Failed to delete teacher");
    }
  };

  const handleStatusToggle = async (teacher: Teacher) => {
    try {
      const newStatus = teacher.status === "active" ? "inactive" : "active";
      const { error } = await supabase
        .from("users")
        .update({ status: newStatus })
        .eq("user_id", teacher.user_id);

      if (error) throw error;
      toast.success(`Teacher ${newStatus === "active" ? "activated" : "deactivated"}`);
      fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update teacher status");
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    if (filters.qualification && filters.qualification !== "all" && t.qualification !== filters.qualification) return false;
    if (filters.minExperience && t.experience < parseInt(filters.minExperience)) return false;
    if (filters.status && filters.status !== "all" && t.status !== filters.status) return false;
    return true;
  });

  const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
          <UserCheck className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Teacher Management</h1>
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
              <Label>Qualification</Label>
              <Select value={filters.qualification} onValueChange={(v) => setFilters({ ...filters, qualification: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="B.Ed">B.Ed</SelectItem>
                  <SelectItem value="M.Ed">M.Ed</SelectItem>
                  <SelectItem value="B.A">B.A</SelectItem>
                  <SelectItem value="M.A">M.A</SelectItem>
                  <SelectItem value="B.Sc">B.Sc</SelectItem>
                  <SelectItem value="M.Sc">M.Sc</SelectItem>
                  <SelectItem value="PhD">PhD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Min Experience (years)</Label>
              <Input
                type="number"
                placeholder="e.g., 5"
                value={filters.minExperience}
                onChange={(e) => setFilters({ ...filters, minExperience: e.target.value })}
              />
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
              <Button variant="outline" onClick={() => setFilters({ qualification: "all", minExperience: "", status: "all" })}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teachers ({filteredTeachers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.map((teacher) => (
                <TableRow key={teacher.teacher_id}>
                  <TableCell className="font-medium">{teacher.full_name}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{teacher.phone}</TableCell>
                  <TableCell>{teacher.qualification}</TableCell>
                  <TableCell>{teacher.experience} years</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.subjects.length > 0 ? (
                        teacher.subjects.map((subject, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {subject}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">No subjects</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant={teacher.status === "active" ? "default" : "secondary"}
                      onClick={() => handleStatusToggle(teacher)}
                    >
                      {teacher.status}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManageSubjects(teacher)}
                        title="Assign Subjects"
                      >
                        <BookOpen className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewSchedule(teacher)}
                        title="View Schedule"
                      >
                        <Calendar className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedTeacher(teacher);
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

      {/* Assign Subjects Dialog */}
      <Dialog open={subjectsDialogOpen} onOpenChange={setSubjectsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Subjects to {selectedTeacher?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto space-y-2">
              {allSubjects.map((subject) => (
                <div key={subject.subject_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{subject.subject_name}</p>
                    <p className="text-sm text-muted-foreground">Class: {subject.class_name}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.subject_id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSubjects([...selectedSubjects, subject.subject_id]);
                      } else {
                        setSelectedSubjects(selectedSubjects.filter(id => id !== subject.subject_id));
                      }
                    }}
                    className="w-5 h-5 cursor-pointer"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSubjectsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveSubjects}>
                Save Assignments
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Schedule Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Teaching Schedule - {selectedTeacher?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {teacherSchedule.length > 0 ? (
              <div className="space-y-3">
                {daysOrder.map((day) => {
                  const daySchedule = teacherSchedule.filter(s => s.day_of_week === day);
                  if (daySchedule.length === 0) return null;
                  
                  return (
                    <div key={day} className="border rounded-lg p-3">
                      <h3 className="font-semibold mb-2">{day}</h3>
                      <div className="space-y-2">
                        {daySchedule.map((schedule) => (
                          <div key={schedule.timetable_id} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                            <div>
                              <p className="font-medium">{schedule.subject_name}</p>
                              <p className="text-sm text-muted-foreground">Class: {schedule.class_name}</p>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {schedule.start_time} - {schedule.end_time}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No schedule found for this teacher</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTeacher?.full_name}? This action cannot be undone.
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
