import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calculator, FileText, FlaskConical, Calendar, Bell, BookOpen } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export default function StudentDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchData = async () => {
      try {
        const { data: profileData } = await supabase
          .from("users")
          .select("*")
          .eq("user_id", user.id)
          .single();

        setProfile(profileData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  const initials = profile?.full_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with App Branding */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 bg-gradient-primary text-white px-4 py-2 rounded-full shadow-md">
            <BookOpen className="w-5 h-5" />
            <span className="font-semibold text-sm">Students App</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-warning rounded-full"></span>
          </Button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Profile Section */}
        <Card className="p-6 bg-gradient-card border-none shadow-card">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-16 h-16 border-4 border-white shadow-md">
                <AvatarFallback className="bg-primary text-white text-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">
                {profile?.full_name || "Student"}
              </h2>
              <p className="text-sm text-muted-foreground">Roll No: S-12345</p>
            </div>
          </div>
        </Card>

        {/* Greeting */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground">
              Ready for a new day?
            </h3>
            <p className="text-sm text-muted-foreground">Let's check your tasks</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center bg-gradient-card border-none shadow-card">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold text-foreground">5</p>
            <p className="text-xs text-muted-foreground">Classes</p>
          </Card>
          <Card className="p-4 text-center bg-gradient-card border-none shadow-card">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-success/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-success" />
            </div>
            <p className="text-2xl font-bold text-foreground">3</p>
            <p className="text-xs text-muted-foreground">Due Soon</p>
          </Card>
          <Card className="p-4 text-center bg-gradient-card border-none shadow-card">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-warning/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-warning" />
            </div>
            <p className="text-2xl font-bold text-foreground">2</p>
            <p className="text-xs text-muted-foreground">Exams</p>
          </Card>
        </div>

        {/* Assignments Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-foreground">Due Soon</h3>
            <Button variant="ghost" size="sm" className="text-primary">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            <Card className="p-4 bg-card border-none shadow-card">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Calculator className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground">Math - Calculus</h4>
                  <p className="text-sm text-muted-foreground">Problem Set</p>
                </div>
                <Button size="sm" className="shrink-0 bg-primary">
                  Submit
                </Button>
              </div>
            </Card>

            <Card className="p-4 bg-card border-none shadow-card">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground">English - Essay Draft</h4>
                    <span className="px-2 py-0.5 bg-warning text-white text-xs rounded-full">
                      1 New
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Due: Tomorrow</p>
                </div>
                <Button size="sm" className="shrink-0 bg-primary">
                  Submit
                </Button>
              </div>
            </Card>

            <Card className="p-4 bg-card border-none shadow-card">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                  <FlaskConical className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground">Physics - Lab Report</h4>
                  <p className="text-sm text-muted-foreground">Online Exam</p>
                </div>
                <Button size="sm" variant="secondary" className="shrink-0">
                  Pending
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Completed Section */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">Completed</h3>
          <div className="space-y-3">
            <Card className="p-4 bg-card border-none shadow-card">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground">History - Research Paper</h4>
                  <p className="text-sm text-muted-foreground">Submitted</p>
                </div>
                <Button size="sm" variant="outline" className="shrink-0 border-success text-success">
                  Feedback
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
