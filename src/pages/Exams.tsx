import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
import { format } from "date-fns";

interface ExamSchedule {
  timetable_id: string;
  exam_date: string;
  start_time: string;
  end_time: string;
  room_no: string;
  subjects: { subject_name: string };
  exams: {
    exam_name: string;
    classes: { class_name: string };
  };
}

export default function Exams() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const { toast } = useToast();
  const [examSchedule, setExamSchedule] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !roleLoading) {
      fetchExams();
    }
  }, [user, roleLoading]);

  const fetchExams = async () => {
    try {
      let query = supabase
        .from("exam_timetable")
        .select(`
          timetable_id,
          exam_date,
          start_time,
          end_time,
          room_no,
          subjects (subject_name),
          exams (
            exam_name,
            classes (class_name)
          )
        `)
        .order("exam_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (role === "student") {
        const { data: studentData } = await supabase
          .from("students")
          .select("class_id")
          .eq("auth_user_id", user?.id)
          .single();

        if (studentData?.class_id) {
          query = query.eq("exams.class_id", studentData.class_id);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setExamSchedule(data || []);
    } catch (error) {
      console.error("Error fetching exams:", error);
      toast({
        title: "Error",
        description: "Failed to load exam schedule",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isUpcoming = (examDate: string) => {
    return new Date(examDate) >= new Date();
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
            <h1 className="text-3xl font-bold">Exam Schedule</h1>
            <p className="text-muted-foreground mt-2">
              View your upcoming examinations
            </p>
          </div>

          {examSchedule.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No exams scheduled
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {examSchedule.map((exam) => (
                <Card key={exam.timetable_id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle>{exam.exams?.exam_name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {exam.subjects?.subject_name} • {exam.exams?.classes?.class_name}
                        </p>
                      </div>
                      <Badge variant={isUpcoming(exam.exam_date) ? "default" : "secondary"}>
                        {isUpcoming(exam.exam_date) ? "Upcoming" : "Completed"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(exam.exam_date), "PPP")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {exam.start_time} - {exam.end_time}
                        </span>
                      </div>
                      {exam.room_no && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Room:</span>
                          <span className="font-medium">{exam.room_no}</span>
                        </div>
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
