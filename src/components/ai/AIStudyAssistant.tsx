import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, BookOpen, Brain, Lightbulb, HelpCircle, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AIStudyAssistantProps {
  studentId: string;
}

const AIStudyAssistant = ({ studentId }: AIStudyAssistantProps) => {
  const [sessionType, setSessionType] = useState("summary");
  const [inputContent, setInputContent] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sessionTypes = [
    { value: "summary", label: "Summarize Content", icon: BookOpen },
    { value: "quiz", label: "Generate Quiz", icon: Brain },
    { value: "flashcard", label: "Create Flashcards", icon: FileText },
    { value: "doubt", label: "Ask a Doubt", icon: HelpCircle },
    { value: "explanation", label: "Simple Explanation", icon: Lightbulb },
  ];

  const handleSubmit = async () => {
    if (!inputContent.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter some content to process",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResponse("");

    try {
      const { data, error } = await supabase.functions.invoke('ai-study-assistant', {
        body: {
          sessionType,
          inputContent,
          studentId,
        },
      });

      if (error) throw error;

      setResponse(data.response);
      toast({
        title: "Success",
        description: "AI response generated successfully",
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
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
            <Brain className="h-5 w-5" />
            AI Study Assistant
          </CardTitle>
          <CardDescription>
            Get help with summaries, quizzes, flashcards, and explanations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">What do you need help with?</label>
            <Select value={sessionType} onValueChange={setSessionType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sessionTypes.map((type) => (
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
            <label className="text-sm font-medium mb-2 block">
              {sessionType === 'doubt' ? 'Ask your question' : 'Enter your content'}
            </label>
            <Textarea
              placeholder={
                sessionType === 'doubt'
                  ? 'Type your doubt or question here...'
                  : 'Paste your study material, notes, or textbook content here...'
              }
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              rows={6}
              className="resize-none"
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Get AI Help'
            )}
          </Button>

          {response && (
            <Card className="mt-4 bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">AI Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm">{response}</div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIStudyAssistant;