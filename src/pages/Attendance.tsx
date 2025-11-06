import { BookOpen, Calendar as CalendarIcon } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Attendance() {
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
        <h1 className="text-2xl font-bold text-foreground">Attendance</h1>

        {/* Toggle Buttons */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="flex-1 rounded-full">
            Daily
          </Button>
          <Button className="flex-1 bg-primary text-white rounded-full">
            Monthly
          </Button>
        </div>

        {/* Calendar */}
        <Card className="p-5 bg-card border-none shadow-card rounded-2xl">
          <div className="text-center mb-4">
            <p className="text-xs text-muted-foreground mb-2">December 2024</p>
            <div className="grid grid-cols-7 gap-1 text-xs font-medium text-foreground mb-2">
              <div className="text-warning">Mon</div>
              <div>Tue</div>
              <div>Tued</div>
              <div>Wed</div>
              <div>Fri</div>
              <div>Fri</div>
              <div className="text-warning">Satt</div>
            </div>
          </div>

          {/* Calendar Grid - Simplified representation */}
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {/* Week 1 */}
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center mx-auto">1</div>
            <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center mx-auto ring-2 ring-primary ring-offset-2">3</div>
            
            {/* Week 2 */}
            <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center mx-auto">1</div>
            <div className="w-8 h-8 flex items-center justify-center mx-auto">3</div>
            <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center mx-auto">4</div>
            <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center mx-auto">6</div>
            <div className="w-8 h-8 flex items-center justify-center mx-auto">7</div>
            <div className="w-8 h-8 flex items-center justify-center mx-auto">8</div>
            <div className="w-8 h-8 rounded-full bg-destructive text-white flex items-center justify-center mx-auto">6</div>
            
            {/* Week 3 */}
            <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center mx-auto">9</div>
            <div className="w-8 h-8 flex items-center justify-center mx-auto">10</div>
            <div className="w-8 h-8 flex items-center justify-center mx-auto">11</div>
            <div className="w-8 h-8 flex items-center justify-center mx-auto">13</div>
            <div className="w-8 h-8 flex items-center justify-center mx-auto">14</div>
            <div className="w-8 h-8 flex items-center justify-center mx-auto">15</div>
            <div className="w-8 h-8 rounded-full bg-destructive text-white flex items-center justify-center mx-auto">16</div>
            
            {/* Week 4 */}
            <div className="w-8 h-8 px-2 py-1 rounded bg-destructive text-white text-xs flex items-center justify-center mx-auto">Abset</div>
            <div className="w-8 h-8 flex items-center justify-center mx-auto">17</div>
            <div className="w-8 h-8 flex items-center justify-center mx-auto text-warning">⚠</div>
            <div className="w-8 h-8 flex items-center justify-center mx-auto">20</div>
            <div className="w-8 h-8 px-2 py-1 rounded bg-destructive text-white text-xs flex items-center justify-center mx-auto">Abset</div>
            <div className="w-8 h-8 flex items-center justify-center mx-auto">22</div>
            <div className="w-8 h-8 px-2 py-1 rounded bg-destructive text-white text-xs flex items-center justify-center mx-auto">Late</div>
            
            {/* Week 5 */}
            <div className="w-8 h-8 rounded-full bg-destructive text-white flex items-center justify-center mx-auto">23</div>
            <div className="w-8 h-8 flex items-center justify-center mx-auto">24</div>
            <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center mx-auto">25</div>
            <div className="w-8 h-8 rounded-full bg-success text-white flex items-center justify-center mx-auto">27</div>
            <div className="w-8 h-8 flex items-center justify-center mx-auto">28</div>
            <div className="w-8 h-8 flex items-center justify-center mx-auto">29</div>
            <div className="w-8 h-8 flex items-center justify-center mx-auto text-success">▲</div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: '92%' }}></div>
          </div>
        </Card>

        {/* Overall Attendance */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Overall Attendance: 92%</h2>
          <div className="flex items-center justify-center gap-3">
            <Card className="flex-1 p-3 bg-card border-none shadow-sm rounded-2xl">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-warning" />
                <div className="text-left">
                  <p className="text-xs font-medium text-foreground">Physics - Mechanics:</p>
                  <p className="text-xs text-muted-foreground">88%</p>
                </div>
              </div>
            </Card>
            <Card className="flex-1 p-3 bg-card border-none shadow-sm rounded-2xl">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-warning" />
                <div className="text-left">
                  <p className="text-xs font-medium text-foreground">English - Literature: 88%</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Online class attendance is marked automatically
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
