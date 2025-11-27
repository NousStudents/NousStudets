import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, Lightbulb, FileCheck, BookText, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AIHomeworkHelperProps {
  studentId: string;
}

const AIHomeworkHelper = ({ studentId }: AIHomeworkHelperProps) => {
  const [helpType, setHelpType] = useState("mistake_detection");
  const [homeworkContent, setHomeworkContent] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const helpTypes = [
    { value: "mistake_detection", label: "Detect Mistakes", icon: CheckCircle2 },
    { value: "hint", label: "Get Hints", icon: Lightbulb },
    { value: "grammar", label: "Grammar Check", icon: FileCheck },
    { value: "sample_answer", label: "Sample Answer", icon: BookText },
    { value: "worksheet", label: "Practice Worksheet", icon: FileSpreadsheet },
  ];

  const handleSubmit = async () => {
    if (!homeworkContent.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter your homework content",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setFeedback("");

    try {
      const { data, error } = await supabase.functions.invoke('ai-homework-helper', {
        body: {
          helpType,
          homeworkContent,
          studentId,
        },
      });

      if (error) throw error;

      setFeedback(data.feedback);
      toast({
        title: "Success",
        description: "AI feedback generated successfully",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            AI Homework Helper
          </CardTitle>
          <CardDescription>
            Get help with mistakes, hints, grammar, and practice problems
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Type of help needed</label>
            <Select value={helpType} onValueChange={setHelpType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {helpTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Your homework</label>
            <Textarea
              placeholder="Paste your homework content, answer, or problem here..."
              value={homeworkContent}
              onChange={(e) => setHomeworkContent(e.target.value)}
              rows={8}
              className="resize-none"
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Get AI Help'
            )}
          </Button>

          {feedback && (
            <Card className="mt-4 bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">AI Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm">{feedback}</div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIHomeworkHelper;