import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Calendar, BookOpen, Plus, FileText, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
import { format } from "date-fns";
import { CreateAssignmentDialog } from "@/components/assignments/CreateAssignmentDialog";
import { SubmitAssignmentDialog } from "@/components/assignments/SubmitAssignmentDialog";

interface Assignment {
  assignment_id: string;
  title: string;
  description: string;
  due_date: string;
  max_marks: number;
  file_url: string | null;
  subjects: { subject_name: string };
  classes: { class_name: string };
  submissions?: { submission_id: string }[];
}

export default function Assignments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<string>("");
  const [teacherId, setTeacherId] = useState<string>("");
  const [studentId, setStudentId] = useState<string>("");

  useEffect(() => {
    if (user && !roleLoading) {
      fetchUserIds();
      fetchAssignments();
    }
  }, [user, roleLoading]);

  const fetchUserIds = async () => {
    if (role === "teacher") {
      const { data } = await supabase
        .from("teachers")
        .select("teacher_id")
        .eq("auth_user_id", user?.id)
        .single();
      if (data) setTeacherId(data.teacher_id);
    } else if (role === "student") {
      const { data } = await supabase
        .from("students")
        .select("student_id")
        .eq("auth_user_id", user?.id)
        .single();
      if (data) setStudentId(data.student_id);
    }
  };

  const fetchAssignments = async () => {
    try {
      let query = supabase
        .from("assignments")
        .select(`
          assignment_id,
          title,
          description,
          due_date,
          max_marks,
          file_url,
          subjects (subject_name),
          classes (class_name),
          submissions (submission_id)
        `)
        .order("due_date", { ascending: true });

      if (role === "student") {
        const { data: studentData } = await supabase
          .from("students")
          .select("class_id, student_id")
          .eq("auth_user_id", user?.id)
          .single();

        if (studentData?.class_id) {
          query = query.eq("class_id", studentData.class_id);
          
          // Filter submissions to only show current student's submissions
          const { data: assignmentsData, error: assignmentsError } = await query;
          if (assignmentsError) throw assignmentsError;
          
          // For each assignment, filter submissions by student
          const assignmentsWithFilteredSubmissions = await Promise.all(
            (assignmentsData || []).map(async (assignment) => {
              const { data: submissionData } = await supabase
                .from("submissions")
                .select("submission_id")
                .eq("assignment_id", assignment.assignment_id)
                .eq("student_id", studentData.student_id);
              
              return {
                ...assignment,
                submissions: submissionData || []
              };
            })
          );
          
          setAssignments(assignmentsWithFilteredSubmissions);
          setLoading(false);
          return;
        }
      } else if (role === "teacher") {
        const { data: teacherData } = await supabase
          .from("teachers")
          .select("teacher_id")
          .eq("auth_user_id", user?.id)
          .single();

        if (teacherData?.teacher_id) {
          // Get classes and subjects from timetable assignments
          const { data: timetableClasses } = await supabase
            .from("timetable")
            .select("class_id, subject_id")
            .eq("teacher_id", teacherData.teacher_id);

          if (timetableClasses && timetableClasses.length > 0) {
            const classIds = [...new Set(timetableClasses.map(t => t.class_id))];
            const subjectIds = [...new Set(timetableClasses.map(t => t.subject_id))];
            
            query = query
              .in("class_id", classIds)
              .in("subject_id", subjectIds);
          }
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const openSubmitDialog = (assignmentId: string) => {
    setSelectedAssignment(assignmentId);
    setSubmitDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Assignments</h1>
              <p className="text-muted-foreground mt-2">
                {role === "teacher" ? "Manage your class assignments" : "View and complete your assignments"}
              </p>
            </div>
            {role === "teacher" && teacherId && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            )}
          </div>

          {assignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No assignments found
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {assignments.map((assignment) => (
                <Card key={assignment.assignment_id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle>{assignment.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BookOpen className="h-4 w-4" />
                          {assignment.subjects?.subject_name}
                          <span>•</span>
                          {assignment.classes?.class_name}
                        </div>
                      </div>
                      {assignment.due_date && (
                        <Badge variant={isOverdue(assignment.due_date) ? "destructive" : "default"}>
                          {isOverdue(assignment.due_date) ? "Overdue" : "Active"}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground">{assignment.description}</p>
                    )}
                    <div className="flex items-center justify-between flex-wrap gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Due: {format(new Date(assignment.due_date), "PPP")}
                      </div>
                      {assignment.max_marks && (
                        <span className="text-muted-foreground">
                          Max Marks: {assignment.max_marks}
                        </span>
                      )}
                    </div>
                    {assignment.file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(assignment.file_url!, "_blank")}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Attachment
                      </Button>
                    )}
                    {role === "student" && studentId && (
                      <div className="flex items-center gap-2 pt-2">
                        {assignment.submissions && assignment.submissions.length > 0 ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Submitted
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => openSubmitDialog(assignment.assignment_id)}
                          >
                            Submit Assignment
                          </Button>
                        )}
                      </div>
                    )}
                    {role === "teacher" && assignment.submissions && (
                      <p className="text-xs text-muted-foreground pt-2">
                        {assignment.submissions.length} submission(s)
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {role === "teacher" && teacherId && (
        <CreateAssignmentDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          teacherId={teacherId}
        />
      )}

      {role === "student" && studentId && (
        <SubmitAssignmentDialog
          open={submitDialogOpen}
          onOpenChange={setSubmitDialogOpen}
          assignmentId={selectedAssignment}
          studentId={studentId}
          onSubmitSuccess={fetchAssignments}
        />
      )}
    </div>
  );
}
