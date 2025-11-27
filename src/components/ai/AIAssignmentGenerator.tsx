import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, FileQuestion, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const AIAssignmentGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [assignmentType, setAssignmentType] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("medium");
  const [questionCount, setQuestionCount] = useState("5");
  const [assignment, setAssignment] = useState<any>(null);

  const generateAssignment = async () => {
    if (!topic || !assignmentType) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assignment-generator', {
        body: { 
          topic, 
          assignmentType, 
          difficultyLevel, 
          questionCount: parseInt(questionCount) 
        }
      });

      if (error) throw error;

      setAssignment(data.assignment);
      toast.success("Assignment generated successfully!");
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Failed to generate assignment");
    } finally {
      setLoading(false);
    }
  };

  const exportAssignment = () => {
    if (!assignment) return;
    
    const content = JSON.stringify(assignment, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `assignment-${topic.replace(/\s+/g, '-')}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Assignment & Question Generator</CardTitle>
          <CardDescription>
            Generate MCQs, short answers, coding questions, and full question papers with answer keys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic *</Label>
            <Input
              id="topic"
              placeholder="e.g., Cell Division, Newton's Laws, Poetry Analysis"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Assignment Type *</Label>
            <Select value={assignmentType} onValueChange={setAssignmentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mcq">Multiple Choice Questions</SelectItem>
                <SelectItem value="short_answer">Short Answer Questions</SelectItem>
                <SelectItem value="descriptive">Descriptive/Essay Questions</SelectItem>
                <SelectItem value="coding">Coding Problems</SelectItem>
                <SelectItem value="full_paper">Full Question Paper</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="count">Number of Questions</Label>
              <Input
                id="count"
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                min="1"
                max="50"
              />
            </div>
          </div>

          <Button 
            onClick={generateAssignment} 
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
                <FileQuestion className="mr-2 h-4 w-4" />
                Generate Assignment
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {assignment && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Assignment</CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">{assignment.assignment_type}</Badge>
                  <Badge variant="outline">{assignment.difficulty_level}</Badge>
                  {assignment.auto_gradable && <Badge>Auto-Gradable</Badge>}
                </div>
              </div>
              <Button onClick={exportAssignment} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Topic: {assignment.topic}</h3>
              <p className="text-sm text-muted-foreground">Max Marks: {assignment.max_marks || 'N/A'}</p>
            </div>

            {assignment.questions && Array.isArray(assignment.questions) && (
              <div className="space-y-4">
                <h3 className="font-semibold">Questions</h3>
                {assignment.questions.map((q: any, i: number) => (
                  <Card key={i} className="bg-muted/50">
                    <CardContent className="pt-4">
                      <p className="font-medium mb-2">
                        Q{i + 1}. {q.question || q.problem || q.content}
                      </p>
                      {q.options && (
                        <ul className="list-none space-y-1 ml-4">
                          {q.options.map((opt: string, j: number) => (
                            <li key={j} className="text-sm">{opt}</li>
                          ))}
                        </ul>
                      )}
                      {q.correct && (
                        <p className="text-sm text-primary mt-2">Correct Answer: {q.correct}</p>
                      )}
                      {q.marks && (
                        <p className="text-sm text-muted-foreground mt-1">Marks: {q.marks}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {assignment.answer_key && (
              <div>
                <h3 className="font-semibold mb-2">Answer Key Available</h3>
                <p className="text-sm text-muted-foreground">
                  Complete answer key with explanations included
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};