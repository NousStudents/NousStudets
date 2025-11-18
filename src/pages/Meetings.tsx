import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, Video, Plus, Users, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";
import { format } from "date-fns";

interface Meeting {
  meeting_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  organizer_id: string;
  meeting_url: string | null;
  meeting_type: string;
}

export default function Meetings() {
  const { user } = useAuth();
  const { role } = useRole();
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    description: "",
    scheduled_at: "",
    duration_minutes: 60,
  });

  useEffect(() => {
    if (user) {
      fetchMeetings();
      subscribeToMeetings();
    }
  }, [user]);

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      toast.error("Failed to load meetings");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMeetings = () => {
    const channel = supabase
      .channel("meetings")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "meetings",
        },
        () => {
          fetchMeetings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const createMeeting = async () => {
    if (!newMeeting.title || !newMeeting.scheduled_at) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      // Generate a simple meeting URL (in production, integrate with a video service)
      const meetingUrl = `https://meet.nousstudents.com/${Math.random().toString(36).substring(7)}`;

      const { error } = await supabase.from("meetings").insert({
        title: newMeeting.title,
        description: newMeeting.description,
        scheduled_at: newMeeting.scheduled_at,
        duration_minutes: newMeeting.duration_minutes,
        school_id: user?.user_metadata?.school_id,
        organizer_id: user?.id,
        meeting_url: meetingUrl,
        meeting_type: "video",
        status: "scheduled",
      });

      if (error) throw error;

      toast.success("Meeting created successfully");
      setIsDialogOpen(false);
      setNewMeeting({
        title: "",
        description: "",
        scheduled_at: "",
        duration_minutes: 60,
      });
    } catch (error) {
      console.error("Error creating meeting:", error);
      toast.error("Failed to create meeting");
    }
  };

  const joinMeeting = (meetingUrl: string | null) => {
    if (meetingUrl) {
      window.open(meetingUrl, "_blank");
    } else {
      toast.error("Meeting link not available");
    }
  };

  const getMeetingStatus = (scheduledAt: string) => {
    const now = new Date();
    const meetingTime = new Date(scheduledAt);
    const diff = meetingTime.getTime() - now.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 0) return { text: "Ended", color: "text-muted-foreground" };
    if (minutes < 15) return { text: "Starting Soon", color: "text-pastel-pink" };
    return { text: "Scheduled", color: "text-pastel-green" };
  };

  return (
    <div className="container mx-auto p-6">
      <Button
        variant="ghost"
        onClick={() => navigate("/dashboard")}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Dashboard
      </Button>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold bg-gradient-rainbow bg-clip-text text-transparent">
          Meetings
        </h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="pastelBlue" className="gap-2">
              <Plus className="w-4 h-4" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Meeting Title *</label>
                <Input
                  placeholder="Enter meeting title"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Meeting description"
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Date & Time *</label>
                <Input
                  type="datetime-local"
                  value={newMeeting.scheduled_at}
                  onChange={(e) => setNewMeeting({ ...newMeeting, scheduled_at: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Duration (minutes)</label>
                <Input
                  type="number"
                  value={newMeeting.duration_minutes}
                  onChange={(e) =>
                    setNewMeeting({ ...newMeeting, duration_minutes: parseInt(e.target.value) })
                  }
                />
              </div>
              <Button onClick={createMeeting} className="w-full" variant="gradient">
                Create Meeting
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {meetings.map((meeting) => {
          const status = getMeetingStatus(meeting.scheduled_at);
          return (
            <Card key={meeting.meeting_id} className="hover:shadow-hover transition-all animate-fade-in">
              <CardHeader className="bg-gradient-to-br from-pastel-purple to-pastel-blue">
                <CardTitle className="text-white flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  {meeting.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {meeting.description && (
                  <p className="text-sm text-muted-foreground">{meeting.description}</p>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-pastel-blue" />
                  <span>{format(new Date(meeting.scheduled_at), "PPP")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-pastel-green" />
                  <span>
                    {format(new Date(meeting.scheduled_at), "p")} ({meeting.duration_minutes} min)
                  </span>
                </div>
                <div className={`flex items-center gap-2 text-sm font-medium ${status.color}`}>
                  <div className="w-2 h-2 rounded-full bg-current animate-pulse-soft" />
                  {status.text}
                </div>
                <Button
                  onClick={() => joinMeeting(meeting.meeting_url)}
                  className="w-full mt-2"
                  variant="pastelPurple"
                >
                  Join Meeting
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {meetings.length === 0 && !loading && (
        <Card className="mt-8 animate-fade-in">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No meetings scheduled</h3>
            <p className="text-muted-foreground mb-4">
              Create your first meeting to get started with virtual collaboration
            </p>
            <Button onClick={() => setIsDialogOpen(true)} variant="gradient">
              Schedule Meeting
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
