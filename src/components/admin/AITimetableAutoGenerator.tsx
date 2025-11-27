import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AITimetableAutoGenerator() {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [generatedTimetable, setGeneratedTimetable] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .order('class_name');

    if (data) setClasses(data);
  };

  const generateTimetable = async () => {
    if (selectedClasses.length === 0) {
      toast({
        title: "Select Classes",
        description: "Please select at least one class",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-timetable-generator', {
        body: {
          classIds: selectedClasses,
          preferences: {
            breakTime: '11:00-11:30',
            lunchTime: '13:00-14:00'
          }
        }
      });

      if (error) throw error;

      setGeneratedTimetable(data);
      toast({
        title: "Timetable Generated",
        description: `Created ${data.summary.totalEntries} timetable entries`
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

  const applyTimetable = async () => {
    if (!generatedTimetable) return;

    try {
      // Delete existing timetable for selected classes
      await supabase
        .from('timetable')
        .delete()
        .in('class_id', selectedClasses);

      // Insert new timetable
      const { error } = await supabase
        .from('timetable')
        .insert(generatedTimetable.timetable);

      if (error) throw error;

      toast({
        title: "Timetable Applied",
        description: "New timetable is now active"
      });

      setGeneratedTimetable(null);
      setSelectedClasses([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          AI Timetable Auto-Generator
        </CardTitle>
        <CardDescription>Generate optimized timetables automatically</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-sm font-medium mb-3">Select Classes</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {classes.map((cls) => (
              <div key={cls.class_id} className="flex items-center space-x-2">
                <Checkbox
                  id={cls.class_id}
                  checked={selectedClasses.includes(cls.class_id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedClasses([...selectedClasses, cls.class_id]);
                    } else {
                      setSelectedClasses(selectedClasses.filter(id => id !== cls.class_id));
                    }
                  }}
                />
                <label
                  htmlFor={cls.class_id}
                  className="text-sm font-medium cursor-pointer"
                >
                  {cls.class_name} {cls.section && `(${cls.section})`}
                </label>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={generateTimetable}
          disabled={loading || selectedClasses.length === 0}
          className="w-full"
        >
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Generate Timetable
        </Button>

        {generatedTimetable && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Generated {generatedTimetable.summary.totalEntries} timetable entries with {generatedTimetable.summary.conflictCount} conflicts detected
              </AlertDescription>
            </Alert>

            {generatedTimetable.conflicts.length > 0 && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-sm text-destructive">Conflicts Detected</CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedTimetable.conflicts.map((conflict: any, idx: number) => (
                    <div key={idx} className="text-sm mb-2">
                      <Badge variant="destructive" className="mr-2">{conflict.type}</Badge>
                      {conflict.day} at {conflict.time}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <div className="flex gap-2">
              <Button onClick={applyTimetable} className="flex-1">
                Apply Timetable
              </Button>
              <Button onClick={() => setGeneratedTimetable(null)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}