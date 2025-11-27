import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, FileEdit, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const AIReportWriter = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedExam, setSelectedExam] = useState("");
  const [comment, setComment] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('teacher_id, school_id')
        .eq('auth_user_id', user.id)
        .single();

      if (teacher) {
        // Fetch students from teacher's classes
        const { data: classes } = await supabase
          .from('classes')
          .select('class_id')
          .eq('class_teacher_id', teacher.teacher_id);

        if (classes && classes.length > 0) {
          const classIds = classes.map(c => c.class_id);
          
          const { data: studentsData } = await supabase
            .from('students')
            .select('student_id, full_name, class_id')
            .in('class_id', classIds);

          setStudents(studentsData || []);
        }

        // Fetch exams
        const { data: examsData } = await supabase
          .from('exams')
          .select('exam_id, exam_name')
          .eq('school_id', teacher.school_id)
          .order('created_at', { ascending: false })
          .limit(10);

        setExams(examsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const generateComment = async () => {
    if (!selectedStudent || !selectedExam) {
      toast.error("Please select both student and exam");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-report-writer', {
        body: { 
          studentId: selectedStudent, 
          examId: selectedExam 
        }
      });

      if (error) throw error;

      setComment(data.comment);
      toast.success("Report comment generated successfully!");
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Failed to generate comment");
    } finally {
      setLoading(false);
    }
  };

  const copyComment = () => {
    if (comment?.comment_text) {
      navigator.clipboard.writeText(comment.comment_text);
      toast.success("Comment copied to clipboard!");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Report Card Comment Writer</CardTitle>
          <CardDescription>
            Generate personalized student comments based on performance, attendance, and behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student">Select Student *</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.student_id} value={student.student_id}>
                    {student.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exam">Select Exam *</Label>
            <Select value={selectedExam} onValueChange={setSelectedExam}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((exam) => (
                  <SelectItem key={exam.exam_id} value={exam.exam_id}>
                    {exam.exam_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={generateComment} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileEdit className="mr-2 h-4 w-4" />
                Generate Comment
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {comment && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Generated Comment</CardTitle>
                <Button onClick={copyComment} variant="outline" size="sm">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={comment.comment_text}
                readOnly
                className="min-h-[120px]"
              />

              {comment.performance_summary && (
                <div>
                  <h3 className="font-semibold mb-2">Performance Summary</h3>
                  <p className="text-muted-foreground">{comment.performance_summary}</p>
                </div>
              )}

              {comment.strengths && comment.strengths.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Strengths</h3>
                  <div className="flex flex-wrap gap-2">
                    {comment.strengths.map((strength: string, i: number) => (
                      <Badge key={i} variant="secondary">{strength}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {comment.areas_for_improvement && comment.areas_for_improvement.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Areas for Improvement</h3>
                  <div className="flex flex-wrap gap-2">
                    {comment.areas_for_improvement.map((area: string, i: number) => (
                      <Badge key={i} variant="outline">{area}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {comment.attendance_remarks && (
                <div>
                  <h3 className="font-semibold mb-2">Attendance</h3>
                  <p className="text-muted-foreground">{comment.attendance_remarks}</p>
                </div>
              )}

              {comment.behavior_remarks && (
                <div>
                  <h3 className="font-semibold mb-2">Behavior</h3>
                  <p className="text-muted-foreground">{comment.behavior_remarks}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};