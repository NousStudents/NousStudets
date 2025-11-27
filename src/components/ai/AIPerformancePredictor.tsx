import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AIPerformancePredictorProps {
  studentId: string;
}

const AIPerformancePredictor = ({ studentId }: AIPerformancePredictorProps) => {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const analyzePerformance = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-performance-predictor', {
        body: { studentId },
      });

      if (error) throw error;

      setPrediction(data.prediction);
      toast({
        title: "Analysis Complete",
        description: "Your performance has been analyzed",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to analyze performance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'high':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'low':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            AI Performance Predictor
          </CardTitle>
          <CardDescription>
            Analyze your academic performance and get personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={analyzePerformance} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze My Performance'
            )}
          </Button>

          {prediction && (
            <div className="space-y-6 mt-6">
              <Card className={`border-2 ${getRiskColor(prediction.overall_risk_level)}`}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {getRiskIcon(prediction.overall_risk_level)}
                    Overall Risk Level: {prediction.overall_risk_level.toUpperCase()}
                  </CardTitle>
                </CardHeader>
              </Card>

              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Attendance Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={prediction.attendance_score} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {prediction.attendance_score.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Marks Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={prediction.marks_score} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {prediction.marks_score.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Assignment Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={prediction.assignment_score} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {prediction.assignment_score.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              </div>

              {prediction.weak_subjects && prediction.weak_subjects.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Weak Subjects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {prediction.weak_subjects.map((subject: any, index: number) => (
                        <Badge key={index} variant="destructive">
                          {subject.subject}: {subject.average}%
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-base">AI Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap text-sm">{prediction.recommendations}</div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIPerformancePredictor;