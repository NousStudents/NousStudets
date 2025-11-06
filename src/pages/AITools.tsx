import { BookOpen, Play, Bot, FileText, TrendingUp } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AITools() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-gradient-primary text-white px-6 py-2 rounded-full shadow-lg">
            <BookOpen className="w-5 h-5" />
            <span className="font-bold text-base">Students App</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-5">
        <h1 className="text-2xl font-bold text-foreground">AI Tools (Smart Features)</h1>

        {/* Video Summary */}
        <Card className="p-5 bg-card border-none shadow-lg rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Play className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">Video → Summary</h3>
              <p className="text-xs text-muted-foreground">Upload or select class recording</p>
            </div>
            <Button size="sm" className="bg-primary text-white rounded-full px-4 shrink-0">
              Summarize
            </Button>
          </div>
        </Card>

        {/* AI Tutor Chatbot */}
        <Card className="p-5 bg-card border-none shadow-lg rounded-2xl">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-foreground flex-1">AI Tutor Chatbot</h3>
          </div>
          <div className="flex items-center gap-2">
            <Input 
              placeholder="Ask study questions..." 
              className="flex-1 bg-muted/50 border-none rounded-full px-4"
            />
            <Button size="icon" className="bg-primary text-white rounded-full shrink-0">
              <TrendingUp className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Generate Quick Notes */}
        <Card className="p-5 bg-card border-none shadow-lg rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">Generate Quick Notes</h3>
              <p className="text-xs text-muted-foreground">From text/video</p>
            </div>
            <Button size="sm" className="bg-primary text-white rounded-full px-4 shrink-0">
              Generate Notes
            </Button>
          </div>
        </Card>

        {/* AI Performance Tips */}
        <Card className="p-5 bg-card border-none shadow-lg rounded-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">AI Performance Tips</h3>
              <p className="text-xs text-muted-foreground">Personalized study insights</p>
            </div>
            <Button size="sm" className="bg-primary text-white rounded-full px-4 shrink-0">
              View Tips
            </Button>
          </div>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
