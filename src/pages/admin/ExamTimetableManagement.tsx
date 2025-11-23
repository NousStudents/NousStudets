import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { Calendar, Plus, Edit, Trash2, BookOpen, Clock, MapPin } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Exam {
  exam_id: string;
  exam_name: string;
  class_id: string;
  start_date: string;
  end_date: string;
  class_name?: string;
  section?: string;
}

interface ExamTimetableEntry {
  timetable_id: string;
  exam_id: string;
  subject_id: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_no: string;
  subject_name?: string;
}

export default function ExamTimetableManagement() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [timetableDialogOpen, setTimetableDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examTimetable, setExamTimetable] = useState<ExamTimetableEntry[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [examFormData, setExamFormData] = useState({
    exam_name: "",
    class_id: "",
    start_date: "",
    end_date: "",
  });

  const [timetableFormData, setTimetableFormData] = useState({
    subject_id: "",
    exam_date: "",
    start_time: "",
    end_time: "",
    room_no: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: adminData } = await supabase
        .from("admins")
        .select("school_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!adminData?.school_id) {
        toast.error("School not found");
        return;
      }

      const [examsRes, classesRes, subjectsRes] = await Promise.all([
        supabase
          .from("exams")
          .select(`
            *,
            classes(class_name, section)
          `)
          .eq("school_id", adminData.school_id)
          .order("start_date", { ascending: false }),
        supabase
          .from("classes")
          .select("*")
          .eq("school_id", adminData.school_id)
          .order("class_name"),
        supabase.from("subjects").select("*").order("subject_name"),
      ]);

      const formattedExams = (examsRes.data || []).map((exam: any) => ({
        ...exam,
        class_name: exam.classes?.class_name,
        section: exam.classes?.section,
      }));

      setExams(formattedExams);
      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load exams");
    } finally {
      setLoading(false);
    }
  };

  const fetchExamTimetable = async (examId: string) => {
    try {
      const { data, error } = await supabase
        .from("exam_timetable")
        .select(`
          *,
          subjects(subject_name)
        `)
        .eq("exam_id", examId)
        .order("exam_date")
        .order("start_time");

      if (error) throw error;

      const formatted = (data || []).map((entry: any) => ({
        ...entry,
        subject_name: entry.subjects?.subject_name,
      }));

      setExamTimetable(formatted);
    } catch (error) {
      console.error("Error fetching exam timetable:", error);
      toast.error("Failed to load exam timetable");
    }
  };

  const handleExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: adminData } = await supabase
        .from("admins")
        .select("school_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!adminData?.school_id) throw new Error("School not found");

      if (editingExam) {
        const { error } = await supabase
          .from("exams")
          .update(examFormData)
          .eq("exam_id", editingExam.exam_id)
          .eq("school_id", adminData.school_id);

        if (error) throw error;
        toast.success("Exam updated successfully");
      } else {
        const { error } = await supabase.from("exams").insert({
          ...examFormData,
          school_id: adminData.school_id,
        });

        if (error) throw error;
        toast.success("Exam created successfully");
      }

      fetchData();
      handleExamDialogClose();
    } catch (error: any) {
      console.error("Error saving exam:", error);
      toast.error(error.message || "Failed to save exam");
    }
  };

  const handleTimetableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedExam) return;

    try {
      const { error } = await supabase.from("exam_timetable").insert({
        ...timetableFormData,
        exam_id: selectedExam.exam_id,
      });

      if (error) throw error;

      toast.success("Exam schedule added successfully");
      await fetchExamTimetable(selectedExam.exam_id);
      setTimetableFormData({
        subject_id: "",
        exam_date: "",
        start_time: "",
        end_time: "",
        room_no: "",
      });
    } catch (error: any) {
      console.error("Error saving exam timetable:", error);
      toast.error(error.message || "Failed to save exam schedule");
    }
  };

  const handleDeleteExam = async () => {
    if (!editingExam) return;

    try {
      const { error } = await supabase
        .from("exams")
        .delete()
        .eq("exam_id", editingExam.exam_id);

      if (error) throw error;

      toast.success("Exam deleted successfully");
      fetchData();
      setDeleteDialogOpen(false);
      setEditingExam(null);
    } catch (error: any) {
      console.error("Error deleting exam:", error);
      toast.error(error.message || "Failed to delete exam");
    }
  };

  const handleEditExam = (exam: Exam) => {
    setEditingExam(exam);
    setExamFormData({
      exam_name: exam.exam_name,
      class_id: exam.class_id,
      start_date: exam.start_date || "",
      end_date: exam.end_date || "",
    });
    setExamDialogOpen(true);
  };

  const handleExamDialogClose = () => {
    setExamDialogOpen(false);
    setEditingExam(null);
    setExamFormData({
      exam_name: "",
      class_id: "",
      start_date: "",
      end_date: "",
    });
  };

  const handleManageTimetable = async (exam: Exam) => {
    setSelectedExam(exam);
    await fetchExamTimetable(exam.exam_id);
    setTimetableDialogOpen(true);
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
          <Calendar className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Exam Timetable Management</h1>
            <p className="text-muted-foreground">Create and manage exam schedules</p>
          </div>
        </div>
        <Button onClick={() => setExamDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Exam
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exams ({exams.length})</CardTitle>
          <CardDescription>Manage exam periods and schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Exam Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No exams found. Click "Create Exam" to add your first exam.
                  </TableCell>
                </TableRow>
              ) : (
                exams.map((exam) => (
                  <TableRow key={exam.exam_id}>
                    <TableCell className="font-semibold">{exam.exam_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {exam.class_name} {exam.section && `- ${exam.section}`}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {exam.start_date && exam.end_date
                        ? `${new Date(exam.start_date).toLocaleDateString()} - ${new Date(exam.end_date).toLocaleDateString()}`
                        : "Not set"}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => handleManageTimetable(exam)}>
                        <Clock className="w-4 h-4 mr-2" />
                        Manage Schedule
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEditExam(exam)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setEditingExam(exam);
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

      {/* Create/Edit Exam Dialog */}
      <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingExam ? "Edit Exam" : "Create New Exam"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleExamSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Exam Name *</Label>
              <Input
                value={examFormData.exam_name}
                onChange={(e) => setExamFormData({ ...examFormData, exam_name: e.target.value })}
                placeholder="e.g., Mid-Term Exam"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Class *</Label>
              <Select
                value={examFormData.class_id}
                onValueChange={(value) => setExamFormData({ ...examFormData, class_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.class_id} value={cls.class_id}>
                      {cls.class_name} {cls.section && `- ${cls.section}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={examFormData.start_date}
                  onChange={(e) => setExamFormData({ ...examFormData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={examFormData.end_date}
                  onChange={(e) => setExamFormData({ ...examFormData, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleExamDialogClose}>
                Cancel
              </Button>
              <Button type="submit">{editingExam ? "Update" : "Create"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Exam Timetable Dialog */}
      <Dialog open={timetableDialogOpen} onOpenChange={setTimetableDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Exam Schedule - {selectedExam?.exam_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <form onSubmit={handleTimetableSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/50">
              <h3 className="font-semibold">Add Exam Schedule</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Select
                    value={timetableFormData.subject_id}
                    onValueChange={(value) => setTimetableFormData({ ...timetableFormData, subject_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects
                        .filter((s) => s.class_id === selectedExam?.class_id)
                        .map((subject) => (
                          <SelectItem key={subject.subject_id} value={subject.subject_id}>
                            {subject.subject_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Exam Date *</Label>
                  <Input
                    type="date"
                    value={timetableFormData.exam_date}
                    onChange={(e) => setTimetableFormData({ ...timetableFormData, exam_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Start Time *</Label>
                  <Input
                    type="time"
                    value={timetableFormData.start_time}
                    onChange={(e) => setTimetableFormData({ ...timetableFormData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time *</Label>
                  <Input
                    type="time"
                    value={timetableFormData.end_time}
                    onChange={(e) => setTimetableFormData({ ...timetableFormData, end_time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label>Room Number</Label>
                  <Input
                    value={timetableFormData.room_no}
                    onChange={(e) => setTimetableFormData({ ...timetableFormData, room_no: e.target.value })}
                    placeholder="e.g., Room 101"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add to Schedule
              </Button>
            </form>

            <div>
              <h3 className="font-semibold mb-4">Current Schedule</h3>
              {examTimetable.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No schedules added yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Room</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {examTimetable.map((entry) => (
                      <TableRow key={entry.timetable_id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-primary" />
                            {entry.subject_name}
                          </div>
                        </TableCell>
                        <TableCell>{new Date(entry.exam_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="w-3 h-3" />
                            {entry.start_time} - {entry.end_time}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="w-3 h-3" />
                            {entry.room_no || "Not assigned"}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{editingExam?.exam_name}"? This will also delete all associated exam schedules. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExam} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
