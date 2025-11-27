import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AIFeePredictionSystem() {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const { toast } = useToast();

  const analyzeFees = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-fee-predictions');

      if (error) throw error;

      setPrediction(data.prediction);
      toast({
        title: "Analysis Complete",
        description: "Fee predictions generated successfully"
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
          <DollarSign className="w-5 h-5" />
          AI Fee Prediction System
        </CardTitle>
        <CardDescription>Forecast collections and identify risks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={analyzeFees}
          disabled={loading}
          className="w-full"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Analyze Fee Data
        </Button>

        {prediction && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">₹{prediction.total_expected}</div>
                  <p className="text-sm text-muted-foreground">Total Expected</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-600">₹{prediction.total_collected}</div>
                  <p className="text-sm text-muted-foreground">Collected</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-red-600">₹{prediction.total_pending}</div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </CardContent>
              </Card>
            </div>

            {prediction.predictions && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Collection Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Collection Rate</span>
                      <span className="font-medium">{prediction.predictions.collectionRate}%</span>
                    </div>
                    <Progress value={parseFloat(prediction.predictions.collectionRate)} />
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                    <AlertTriangle className={`w-5 h-5 ${
                      prediction.predictions.riskLevel === 'high' ? 'text-red-600' :
                      prediction.predictions.riskLevel === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`} />
                    <div>
                      <div className="text-sm font-medium">Risk Level: {prediction.predictions.riskLevel.toUpperCase()}</div>
                      <div className="text-sm text-muted-foreground">
                        {prediction.predictions.overdueCount} overdue fees
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {prediction.recommendations && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">AI Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{prediction.recommendations}</p>
                </CardContent>
              </Card>
            )}

            {prediction.unusual_activities && prediction.unusual_activities.length > 0 && (
              <Card className="border-yellow-600">
                <CardHeader>
                  <CardTitle className="text-base text-yellow-600">Unusual Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  {prediction.unusual_activities.map((activity: any, idx: number) => (
                    <div key={idx} className="text-sm mb-2">
                      <strong>{activity.type}:</strong> {activity.percentage}% ({activity.count} cases)
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}