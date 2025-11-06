import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, FlaskConical, MessageCircle, BookOpen } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export default function StudentDashboard() {
  const { user } = useAuth();
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

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header with App Branding */}
      <div className="bg-card border-b border-border sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-center">
          <div className="flex items-center gap-2 bg-gradient-primary text-white px-6 py-2 rounded-full shadow-lg">
            <BookOpen className="w-5 h-5" />
            <span className="font-bold text-base">Students App</span>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Welcome back, Alex!</h1>
            <p className="text-sm text-muted-foreground">Ready for a new day?</p>
          </div>
          <Avatar className="w-12 h-12 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary">
              {profile?.full_name?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Timetable & Exam Card */}
        <Card className="p-5 bg-gradient-card border-2 border-primary/30 shadow-lg rounded-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Timetable</h3>
                <p className="text-xs text-muted-foreground">Next class: Physics - 9 AM</p>
              </div>
            </div>
            <div className="text-right">
              <FlaskConical className="w-8 h-8 text-primary mb-1 ml-auto" />
              <p className="text-xs font-semibold text-foreground">Upcoming Exam</p>
              <p className="text-xs text-muted-foreground">Maths - Dec 18</p>
            </div>
          </div>
        </Card>

        {/* Messages & Subjects Card */}
        <Card className="p-5 bg-gradient-card border-2 border-primary/30 shadow-lg rounded-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center relative">
                <MessageCircle className="w-6 h-6 text-primary" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-warning text-white text-xs rounded-full flex items-center justify-center font-bold">
                  2
                </span>
              </div>
              <div>
                <h3 className="font-bold text-foreground">Messages</h3>
                <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <span className="px-2 py-0.5 bg-warning text-white text-xs rounded-full">2 New</span>
                </p>
              </div>
            </div>
            <div className="text-right">
              <BookOpen className="w-8 h-8 text-primary mb-1 ml-auto" />
              <p className="text-xs font-semibold text-foreground">Subjects</p>
            </div>
          </div>
        </Card>

        {/* Today's Homework */}
        <div>
          <h3 className="text-lg font-bold text-foreground mb-3">Today's Homework</h3>
          <Card className="p-4 bg-card border-none shadow-card rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">Aeglah ii tomestond</h4>
                <p className="text-xs text-muted-foreground">3 AM</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
