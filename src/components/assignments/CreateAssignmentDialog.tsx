import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Upload, Loader2, X } from "lucide-react";
import { useTeacherTimetableClasses } from "@/hooks/useTeacherTimetableClasses";

interface Student {
  student_id: string;
  full_name: string;
  roll_no: string;
}

interface CreateAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacherId: string;
}

export function CreateAssignmentDialog({ open, onOpenChange, teacherId }: CreateAssignmentDialogProps) {
  const { user } = useAuth();
  const { classes, subjects, classIds, subjectIds } = useTeacherTimetableClasses(teacherId);
  
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [assignToAll, setAssignToAll] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [maxMarks, setMaxMarks] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (selectedClassId) {
      fetchStudents();
    }
  }, [selectedClassId]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("student_id, full_name, roll_no")
        .eq("class_id", selectedClassId)
        .order("roll_no");

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!file || !user) return null;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${teacherId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("assignment-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("assignment-files")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !selectedClassId || !selectedSubjectId) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!assignToAll && selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }

    setCreating(true);
    try {
      // Upload file if present
      let fileUrl = null;
      if (file) {
        setUploading(true);
        fileUrl = await uploadFile();
        setUploading(false);
      }

      // Create assignment
      const { data: assignment, error: assignmentError } = await supabase
        .from("assignments")
        .insert({
          teacher_id: teacherId,
          class_id: selectedClassId,
          subject_id: selectedSubjectId,
          title: title.trim(),
          description: description.trim() || null,
          due_date: dueDate || null,
          max_marks: maxMarks ? parseFloat(maxMarks) : null,
          file_url: fileUrl,
        })
        .select()
        .single();

      if (assignmentError) throw assignmentError;

      // If not assigning to all, create individual student assignments
      if (!assignToAll && assignment) {
        const studentAssignments = selectedStudents.map(studentId => ({
          assignment_id: assignment.assignment_id,
          student_id: studentId,
        }));

        const { error: studentError } = await supabase
          .from("assignment_students")
          .insert(studentAssignments);

        if (studentError) throw studentError;
      }

      toast.success("Assignment created successfully");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error("Failed to create assignment");
    } finally {
      setCreating(false);
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate("");
    setMaxMarks("");
    setFile(null);
    setSelectedClassId("");
    setSelectedSubjectId("");
    setSelectedStudents([]);
    setAssignToAll(true);
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Assignment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class">Class *</Label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.class_id} value={cls.class_id}>
                      {cls.class_name} {cls.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.subject_id} value={subject.subject_id}>
                      {subject.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Assignment Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Chapter 5 Exercises"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Instructions</Label>
            <Textarea
              id="description"
              placeholder="Add assignment instructions here..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxMarks">Max Marks</Label>
              <Input
                id="maxMarks"
                type="number"
                placeholder="e.g., 100"
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Attach File (Optional)</Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
              />
              <label htmlFor="file-upload" className="flex-1">
                <Button type="button" variant="outline" className="w-full" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {file ? file.name : "Choose File"}
                  </span>
                </Button>
              </label>
              {file && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-3 border rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="assignToAll"
                checked={assignToAll}
                onCheckedChange={(checked) => setAssignToAll(checked as boolean)}
              />
              <Label htmlFor="assignToAll" className="cursor-pointer">
                Assign to entire class
              </Label>
            </div>

            {!assignToAll && students.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <Label className="text-sm text-muted-foreground">Select Students:</Label>
                {students.map(student => (
                  <div key={student.student_id} className="flex items-center gap-2">
                    <Checkbox
                      id={student.student_id}
                      checked={selectedStudents.includes(student.student_id)}
                      onCheckedChange={() => toggleStudent(student.student_id)}
                    />
                    <Label htmlFor={student.student_id} className="cursor-pointer text-sm">
                      {student.roll_no} - {student.full_name}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating || uploading}>
            {creating || uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploading ? "Uploading..." : "Creating..."}
              </>
            ) : (
              "Create Assignment"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}