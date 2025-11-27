import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCheck, TrendingUp, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function AITeacherPerformanceMonitor() {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [analytics, setAnalytics] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const { data } = await supabase
      .from('teachers')
      .select('*')
      .order('full_name');

    if (data) setTeachers(data);
  };

  const analyzePerformance = async () => {
    if (!selectedTeacher) {
      toast({
        title: "Select Teacher",
        description: "Please select a teacher to analyze",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-teacher-performance', {
        body: { teacherId: selectedTeacher, period: 'monthly' }
      });

      if (error) throw error;

      setAnalytics(data.analytics);
      toast({
        title: "Analysis Complete",
        description: "Performance data generated successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          AI Teacher Performance Monitor
        </CardTitle>
        <CardDescription>Analyze and track teacher effectiveness</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a teacher" />
            </SelectTrigger>
            <SelectContent>
              {teachers.map((teacher) => (
                <SelectItem key={teacher.teacher_id} value={teacher.teacher_id}>
                  {teacher.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button onClick={analyzePerformance} disabled={loading || !selectedTeacher}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Analyze
          </Button>
        </div>

        {analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Class Results Average</span>
                      <span className="font-medium">{analytics.class_results_avg.toFixed(1)}%</span>
                    </div>
                    <Progress value={analytics.class_results_avg} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Assignment Completion</span>
                      <span className="font-medium">{analytics.assignment_completion_rate.toFixed(1)}%</span>
                    </div>
                    <Progress value={analytics.assignment_completion_rate} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {analytics.strengths && analytics.strengths.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analytics.strengths.map((strength: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Badge variant="secondary" className="mt-0.5">✓</Badge>
                        <span className="text-sm">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {analytics.areas_for_improvement && analytics.areas_for_improvement.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
                    <AlertCircle className="w-4 h-4" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analytics.areas_for_improvement.map((area: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5">!</Badge>
                        <span className="text-sm">{area}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {analytics.recommendations && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{analytics.recommendations}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}