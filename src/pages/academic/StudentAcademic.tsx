import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, Trophy, Calendar, TrendingUp, CheckCircle, ClipboardList } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
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
        .single();

      if (!studentData) return;

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
            submissions: submissionData || []
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
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Academic Portal</h1>
          <p className="text-muted-foreground">Your complete academic overview</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-pastel-blue/30 border-pastel-blue/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Total Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8</div>
          </CardContent>
        </Card>

        <Card className="bg-pastel-mint/30 border-pastel-mint/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">
              {assignments.filter(a => a.submissions.length === 0).length} pending
            </p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-yellow/30 border-pastel-yellow/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Average Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">A-</div>
          </CardContent>
        </Card>

        <Card className="bg-pastel-peach/30 border-pastel-peach/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2</div>
          </CardContent>
        </Card>
      </div>

      {/* Subject Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject Performance</CardTitle>
          <CardDescription>Your grades across all subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['Mathematics', 'Physics', 'Chemistry', 'English', 'Computer Science', 'Biology'].map((subject) => (
              <div key={subject} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{subject}</h4>
                    <p className="text-sm text-muted-foreground">Current Grade: A</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">View Details</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Assignments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Recent Assignments
              </CardTitle>
              <CardDescription>Your latest assignments and submissions</CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate("/assignments")}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading assignments...</div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No assignments yet</div>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div
                  key={assignment.assignment_id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">{assignment.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {assignment.subjects?.subject_name}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <p className="text-xs text-muted-foreground">
                        Due: {format(new Date(assignment.due_date), "PP")}
                      </p>
                      {assignment.submissions.length > 0 ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Submitted
                        </Badge>
                      ) : isOverdue(assignment.due_date) ? (
                        <Badge variant="destructive">Overdue</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </div>
                  </div>
                  {assignment.submissions.length === 0 && (
                    <Button
                      size="sm"
                      onClick={() => navigate("/assignments")}
                    >
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Academic Progress
          </CardTitle>
          <CardDescription>Your performance trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Progress charts coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}