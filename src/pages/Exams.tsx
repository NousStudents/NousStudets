import { BookOpen, FlaskConical, Download } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Exams() {
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
        <h1 className="text-2xl font-bold text-foreground">Upcoming Exams</h1>

        {/* Exam Cards */}
        <div className="space-y-4">
          <Card className="p-5 bg-card border-2 border-primary/30 shadow-lg rounded-3xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FlaskConical className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground mb-1">Monday, Dec 18</h3>
                <p className="text-sm font-semibold text-foreground">9:00 - 11:00 AM</p>
                <p className="text-sm text-muted-foreground">Room 3B</p>
              </div>
              <Button size="sm" className="bg-secondary text-foreground rounded-full px-4 shrink-0">
                Details
              </Button>
            </div>
          </Card>

          <Card className="p-5 bg-card border-2 border-primary/30 shadow-lg rounded-3xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FlaskConical className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground mb-1">Tuesday, Dec 19</h3>
                <p className="text-sm font-semibold text-foreground">Physics - Mechanics</p>
                <p className="text-sm text-muted-foreground">Online Exam</p>
              </div>
              <Button size="sm" className="bg-secondary text-foreground rounded-full px-4 shrink-0">
                Details
              </Button>
            </div>
          </Card>

          <Card className="p-5 bg-card border-2 border-primary/30 shadow-lg rounded-3xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-warning" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground mb-1">Wednesday, Dec 20</h3>
                <p className="text-sm font-semibold text-foreground">English - Literature</p>
                <p className="text-sm text-muted-foreground">Online Exam</p>
              </div>
              <Button size="sm" className="bg-secondary text-foreground rounded-full px-4 shrink-0">
                Details
              </Button>
            </div>
          </Card>
        </div>

        {/* PDF Download Info */}
        <div className="flex items-center justify-center gap-2 text-primary">
          <Download className="w-5 h-5" />
          <p className="text-sm font-medium">Downloadable PDF available</p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
