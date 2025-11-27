import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, BarChart3, AlertTriangle, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const AIAttendanceAnalyzer = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    fetchTeacherClasses();
  }, [user]);

  const fetchTeacherClasses = async () => {
    if (!user) return;

    try {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('teacher_id')
        .eq('auth_user_id', user.id)
        .single();

      if (teacher) {
        const { data: classesData } = await supabase
          .from('classes')
          .select('class_id, class_name, section')
          .eq('class_teacher_id', teacher.teacher_id);

        setClasses(classesData || []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const analyzeAttendance = async () => {
    if (!selectedClass) {
      toast.error("Please select a class");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-attendance-analyzer', {
        body: { classId: selectedClass }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      toast.success("Attendance analysis completed!");
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Failed to analyze attendance");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Attendance Analyzer</CardTitle>
          <CardDescription>
            Identify absent students, predict attendance drops, and get follow-up recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="class">Select Class *</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.class_id} value={cls.class_id}>
                    {cls.class_name} {cls.section && `- ${cls.section}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={analyzeAttendance} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 className="mr-2 h-4 w-4" />
                Analyze Attendance
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {analysis && (
        <>
          {analysis.frequent_absentees && analysis.frequent_absentees.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Frequently Absent Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.frequent_absentees.map((student: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{student.name || `Student ${i + 1}`}</p>
                        <p className="text-sm text-muted-foreground">
                          Attendance: {student.percentage || student.attendance_percentage}%
                        </p>
                      </div>
                      <Badge variant={parseFloat(student.percentage || student.attendance_percentage) < 60 ? "destructive" : "secondary"}>
                        {student.concern_level || "Attention Needed"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analysis.predicted_dropouts && analysis.predicted_dropouts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                  At Risk of Dropping Out
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.predicted_dropouts.map((student: any, i: number) => (
                    <Card key={i} className="bg-muted/50">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{student.name || `Student ${i + 1}`}</p>
                          <Badge variant="destructive">{student.risk_level}</Badge>
                        </div>
                        {student.reasons && Array.isArray(student.reasons) && (
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {student.reasons.map((reason: string, j: number) => (
                              <li key={j}>{reason}</li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {analysis.recommendations && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {analysis.recommendations}
                </p>
              </CardContent>
            </Card>
          )}

          {analysis.insights && (
            <Card>
              <CardHeader>
                <CardTitle>Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {analysis.insights}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};