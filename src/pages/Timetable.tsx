import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import StudentTimetable from "@/components/StudentTimetable";
import TeacherTimetable from "@/components/TeacherTimetable";
import { useRole } from "@/hooks/useRole";

export default function Timetable() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, loading } = useRole();
  const [studentId, setStudentId] = useState<string>("");
  const [teacherId, setTeacherId] = useState<string>("");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (user && !loading) {
      fetchRoleIds();
    }
  }, [user, loading]);

  const fetchRoleIds = async () => {
    try {
      if (role === "student") {
        const { data: studentData } = await supabase
          .from("students")
          .select("student_id")
          .eq("auth_user_id", user?.id)
          .single();
        if (studentData) setStudentId(studentData.student_id);
      } else if (role === "teacher") {
        const { data: teacherData } = await supabase
          .from("teachers")
          .select("teacher_id")
          .eq("auth_user_id", user?.id)
          .single();
        if (teacherData) setTeacherId(teacherData.teacher_id);
      }
    } catch (error) {
      console.error("Error fetching role IDs:", error);
    } finally {
      setFetching(false);
    }
  };

  if (loading || fetching) {
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
          <h1 className="text-3xl font-bold">My Timetable</h1>
          {role === "student" && studentId && <StudentTimetable studentId={studentId} />}
          {role === "teacher" && teacherId && <TeacherTimetable teacherId={teacherId} />}
          {role === "parent" && (
            <div className="text-center py-8 text-muted-foreground">
              Please select a child to view their timetable
            </div>
          )}
          {role === "admin" && (
            <div className="text-center py-8 text-muted-foreground">
              View timetables from the Timetable Management section
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
