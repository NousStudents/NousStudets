import { BookOpen } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";

export default function Exams() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-gradient-primary text-white px-4 py-2 rounded-full shadow-md">
            <BookOpen className="w-5 h-5" />
            <span className="font-semibold text-sm">Students App</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Exams</h1>
        <Card className="p-8 text-center bg-gradient-card border-none shadow-card">
          <p className="text-muted-foreground">Coming Soon</p>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
