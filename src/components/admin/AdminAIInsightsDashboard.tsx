import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, AlertTriangle, Users, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminAIInsightsDashboard() {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const { toast } = useToast();

  const generateInsights = async (type: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-ai-insights', {
        body: { insightType: type }
      });

      if (error) throw error;

      setInsights(data.insight);
      toast({
        title: "Insights Generated",
        description: "AI analysis completed successfully"
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Insights Dashboard</CardTitle>
          <CardDescription>Real-time predictions and analytics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => generateInsights('attendance')}
              disabled={loading}
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
            >
              <Users className="w-6 h-6" />
              <span>Attendance Insights</span>
            </Button>

            <Button
              onClick={() => generateInsights('academics')}
              disabled={loading}
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
            >
              <TrendingUp className="w-6 h-6" />
              <span>Academic Performance</span>
            </Button>

            <Button
              onClick={() => generateInsights('fee_collection')}
              disabled={loading}
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
            >
              <DollarSign className="w-6 h-6" />
              <span>Fee Collection</span>
            </Button>

            <Button
              onClick={() => generateInsights('all')}
              disabled={loading}
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
            >
              <AlertTriangle className="w-6 h-6" />
              <span>Comprehensive Analysis</span>
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          )}

          {insights && !loading && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{insights.insight_type}</Badge>
                <span className="text-sm text-muted-foreground">
                  Generated {new Date(insights.created_at).toLocaleString()}
                </span>
              </div>

              {insights.predictions && Object.keys(insights.predictions).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Predictions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(insights.predictions, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {insights.recommendations && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{insights.recommendations}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}