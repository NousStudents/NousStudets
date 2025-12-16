import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  FileText,
  Trophy,
  Calendar,
  TrendingUp,
  CheckCircle,
  ClipboardList,
  GraduationCap,
  ArrowRight,
  Clock,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface Assignment {
  assignment_id: string;
  title: string;
  due_date: string;
  subjects: { subject_name: string };
  submissions: { submission_id: string }[];
}

export default function StudentAcademic() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      const { data: studentData } = await supabase
        .from("students")
        .select("class_id, student_id")
        .eq("auth_user_id", user?.id)
        .maybeSingle();

      if (!studentData) {
        setLoading(false);
        return;
      }

      const { data: assignmentsData, error } = await supabase
        .from("assignments")
        .select(`
          assignment_id,
          title,
          due_date,
          subjects (subject_name)
        `)
        .eq("class_id", studentData.class_id)
        .order("due_date", { ascending: true })
        .limit(5);

      if (error) throw error;

      const assignmentsWithSubmissions = await Promise.all(
        (assignmentsData || []).map(async (assignment) => {
          const { data: submissionData } = await supabase
            .from("submissions")
            .select("submission_id")
            .eq("assignment_id", assignment.assignment_id)
            .eq("student_id", studentData.student_id);

          return {
            ...assignment,
            submissions: submissionData || [],
          };
        })
      );

      setAssignments(assignmentsWithSubmissions);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <header className="flex items-center gap-4">
          <BackButton />
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Academic Portal</h1>
              <p className="text-sm text-muted-foreground">Your complete academic overview</p>
            </div>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">8</p>
                  <p className="text-xs text-muted-foreground">Subjects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{assignments.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {assignments.filter((a) => a.submissions.length === 0).length} pending
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Trophy className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">A-</p>
                  <p className="text-xs text-muted-foreground">Avg Grade</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">2</p>
                  <p className="text-xs text-muted-foreground">Exams Soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subject Performance */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Subject Performance
            </CardTitle>
            <CardDescription>Your grades across all subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {[
                { name: "Mathematics", grade: "A", color: "bg-blue-500" },
                { name: "Physics", grade: "A-", color: "bg-purple-500" },
                { name: "Chemistry", grade: "B+", color: "bg-green-500" },
                { name: "English", grade: "A", color: "bg-amber-500" },
                { name: "Computer Science", grade: "A+", color: "bg-cyan-500" },
                { name: "Biology", grade: "A-", color: "bg-pink-500" },
              ].map((subject) => (
                <div
                  key={subject.name}
                  className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-2 w-2 rounded-full ${subject.color}`} />
                    <div>
                      <h4 className="font-medium text-foreground">{subject.name}</h4>
                      <p className="text-xs text-muted-foreground">Current Grade: {subject.grade}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    Details
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Assignments */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Recent Assignments
                </CardTitle>
                <CardDescription>Your latest assignments and submissions</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate("/assignments")}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-pulse text-muted-foreground">Loading assignments...</div>
              </div>
            ) : assignments.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                <p className="text-muted-foreground">No assignments yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.assignment_id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground truncate">{assignment.title}</h4>
                      <p className="text-sm text-muted-foreground">{assignment.subjects?.subject_name}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(assignment.due_date), "PP")}
                        </div>
                        {assignment.submissions.length > 0 ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Submitted
                          </Badge>
                        ) : isOverdue(assignment.due_date) ? (
                          <Badge variant="destructive" className="text-xs">
                            Overdue
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                    {assignment.submissions.length === 0 && (
                      <Button size="sm" onClick={() => navigate("/assignments")} className="ml-4 shrink-0">
                        Submit
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Progress Tracker */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Academic Progress
            </CardTitle>
            <CardDescription>Your performance trends</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground">Progress charts coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
