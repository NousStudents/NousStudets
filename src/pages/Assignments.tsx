import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Calendar, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
import { format } from "date-fns";

interface Assignment {
  assignment_id: string;
  title: string;
  description: string;
  due_date: string;
  max_marks: number;
  subjects: { subject_name: string };
  classes: { class_name: string };
}

export default function Assignments() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !roleLoading) {
      fetchAssignments();
    }
  }, [user, roleLoading]);

  const fetchAssignments = async () => {
    try {
      const { data: userData } = await supabase
        .from("users")
        .select("user_id, role")
        .eq("auth_user_id", user?.id)
        .single();

      if (!userData) return;

      let query = supabase
        .from("assignments")
        .select(`
          assignment_id,
          title,
          description,
          due_date,
          max_marks,
          subjects (subject_name),
          classes (class_name)
        `)
        .order("due_date", { ascending: true });

      if (role === "student") {
        const { data: studentData } = await supabase
          .from("students")
          .select("class_id")
          .eq("user_id", userData.user_id)
          .single();

        if (studentData?.class_id) {
          query = query.eq("class_id", studentData.class_id);
        }
      } else if (role === "teacher") {
        const { data: teacherData } = await supabase
          .from("teachers")
          .select("teacher_id")
          .eq("user_id", userData.user_id)
          .single();

        if (teacherData?.teacher_id) {
          query = query.eq("teacher_id", teacherData.teacher_id);
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
          <div>
            <h1 className="text-3xl font-bold">Assignments</h1>
            <p className="text-muted-foreground mt-2">
              {role === "teacher" ? "Manage your class assignments" : "View and complete your assignments"}
            </p>
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
                    <div className="flex items-center justify-between text-sm">
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
