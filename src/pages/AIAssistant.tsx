import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackButton } from "@/components/BackButton";
import AIStudyAssistant from "@/components/ai/AIStudyAssistant";
import AIHomeworkHelper from "@/components/ai/AIHomeworkHelper";
import AITimetableManager from "@/components/ai/AITimetableManager";
import AIPerformancePredictor from "@/components/ai/AIPerformancePredictor";
import { Loader2 } from "lucide-react";

const AIAssistant = () => {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/auth');
          return;
        }

        const { data: studentData, error } = await supabase
          .from('students')
          .select('student_id')
          .eq('auth_user_id', user.id)
          .single();

        if (error || !studentData) {
          console.error('Error fetching student:', error);
          navigate('/');
          return;
        }

        setStudentId(studentData.student_id);
      } catch (error) {
        console.error('Error:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentId();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!studentId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <BackButton />
        
        <div>
          <h1 className="text-3xl font-bold">AI Assistant</h1>
          <p className="text-muted-foreground mt-2">
            Your personal AI-powered learning companion
          </p>
        </div>

        <Tabs defaultValue="study" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="study">Study Assistant</TabsTrigger>
            <TabsTrigger value="homework">Homework Helper</TabsTrigger>
            <TabsTrigger value="timetable">Timetable Manager</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="study" className="mt-6">
            <AIStudyAssistant studentId={studentId} />
          </TabsContent>

          <TabsContent value="homework" className="mt-6">
            <AIHomeworkHelper studentId={studentId} />
          </TabsContent>

          <TabsContent value="timetable" className="mt-6">
            <AITimetableManager studentId={studentId} />
          </TabsContent>

          <TabsContent value="performance" className="mt-6">
            <AIPerformancePredictor studentId={studentId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIAssistant;