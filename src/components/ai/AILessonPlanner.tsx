import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, FileText, Download } from "lucide-react";

export const AILessonPlanner = () => {
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [duration, setDuration] = useState("60");
  const [lessonPlan, setLessonPlan] = useState<any>(null);

  const generateLessonPlan = async () => {
    if (!topic || !gradeLevel) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-lesson-planner', {
        body: { topic, gradeLevel, duration: parseInt(duration) }
      });

      if (error) throw error;

      setLessonPlan(data.lessonPlan);
      toast.success("Lesson plan generated successfully!");
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Failed to generate lesson plan");
    } finally {
      setLoading(false);
    }
  };

  const exportPlan = () => {
    if (!lessonPlan) return;
    
    const content = JSON.stringify(lessonPlan, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lesson-plan-${topic.replace(/\s+/g, '-')}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Lesson Plan Generator</CardTitle>
          <CardDescription>
            Generate comprehensive lesson plans with teaching steps, activities, and learning outcomes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Lesson Topic *</Label>
            <Input
              id="topic"
              placeholder="e.g., Photosynthesis, World War II, Quadratic Equations"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade Level *</Label>
              <Select value={gradeLevel} onValueChange={setGradeLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={`Grade ${i + 1}`}>
                      Grade {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="30"
                max="180"
              />
            </div>
          </div>

          <Button 
            onClick={generateLessonPlan} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Generate Lesson Plan
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {lessonPlan && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Lesson Plan</CardTitle>
              <Button onClick={exportPlan} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Topic</h3>
              <p className="text-muted-foreground">{lessonPlan.topic}</p>
            </div>

            {lessonPlan.learning_outcomes && lessonPlan.learning_outcomes.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Learning Outcomes</h3>
                <ul className="list-disc list-inside space-y-1">
                  {lessonPlan.learning_outcomes.map((outcome: any, i: number) => (
                    <li key={i} className="text-muted-foreground">{outcome}</li>
                  ))}
                </ul>
              </div>
            )}

            {lessonPlan.teaching_steps && lessonPlan.teaching_steps.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Teaching Steps</h3>
                <ol className="list-decimal list-inside space-y-2">
                  {lessonPlan.teaching_steps.map((step: any, i: number) => (
                    <li key={i} className="text-muted-foreground">{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {lessonPlan.activities && lessonPlan.activities.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Activities</h3>
                <ul className="list-disc list-inside space-y-1">
                  {lessonPlan.activities.map((activity: any, i: number) => (
                    <li key={i} className="text-muted-foreground">{activity}</li>
                  ))}
                </ul>
              </div>
            )}

            {lessonPlan.examples && lessonPlan.examples.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Examples</h3>
                <ul className="list-disc list-inside space-y-1">
                  {lessonPlan.examples.map((example: any, i: number) => (
                    <li key={i} className="text-muted-foreground">{example}</li>
                  ))}
                </ul>
              </div>
            )}

            {lessonPlan.lesson_content?.content && (
              <div>
                <h3 className="font-semibold mb-2">Full Content</h3>
                <Textarea
                  value={typeof lessonPlan.lesson_content === 'string' 
                    ? lessonPlan.lesson_content 
                    : lessonPlan.lesson_content.content}
                  readOnly
                  className="min-h-[200px]"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};