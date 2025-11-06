import { BookOpen, FlaskConical, Calendar, TrendingUp, ClipboardList, Megaphone } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function Notifications() {
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
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>

        {/* Filter Tabs */}
        <div className="flex items-center gap-3">
          <Button className="bg-primary text-white rounded-full px-6">
            All
          </Button>
          <Button variant="ghost" className="rounded-full px-6">
            Unread
          </Button>
        </div>

        {/* Notification Cards */}
        <div className="space-y-3">
          <Card className="p-4 bg-card border-none shadow-card rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <FlaskConical className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  <span className="font-bold">Teacher Alex:</span> New assignment posted in Physics. Due: Nov 20
                  <span className="ml-2 px-2 py-0.5 bg-warning text-white text-xs rounded-full">New</span>
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card border-none shadow-card rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  <span className="font-bold">Upcoming Exam:</span> Math - Calculus tomorrow at 9 AM
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card border-none shadow-card rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  <span className="font-bold">Physics Result Published:</span> View your grade.
                </p>
              </div>
              <Button size="sm" className="bg-primary text-white rounded-full px-4 shrink-0">
                View Result
              </Button>
            </div>
          </Card>

          <Card className="p-4 bg-card border-none shadow-card rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  <span className="font-bold">Attendance Marked:</span> You were marked Present in English
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-card border-none shadow-card rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                <Megaphone className="w-5 h-5 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  <span className="font-bold">Admin:</span> School-wide holiday holiday on Nov 25
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Settings */}
        <div className="pt-4">
          <h2 className="text-lg font-bold text-foreground mb-3">Settings</h2>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Push Notifications</span>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
