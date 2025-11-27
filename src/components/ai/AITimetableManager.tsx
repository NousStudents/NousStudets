import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar, Clock, CheckCircle2, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";

interface AITimetableManagerProps {
  studentId: string;
}

const AITimetableManager = ({ studentId }: AITimetableManagerProps) => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateSchedule = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-timetable-manager', {
        body: {
          action: 'generate_schedule',
          studentId,
        },
      });

      if (error) throw error;

      setSchedule(data.schedule || []);
      toast({
        title: "Schedule Generated",
        description: "Your personalized study schedule has been created",
      });
      
      // Fetch reminders after generating schedule
      fetchReminders();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to generate schedule. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-timetable-manager', {
        body: {
          action: 'get_reminders',
          studentId,
        },
      });

      if (error) throw error;

      setReminders(data.reminders || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
  };

  const markCompleted = async (scheduleId: string) => {
    try {
      const { error } = await supabase.functions.invoke('ai-timetable-manager', {
        body: {
          action: 'mark_completed',
          studentId,
          scheduleData: { scheduleId },
        },
      });

      if (error) throw error;

      toast({
        title: "Marked Complete",
        description: "Study session marked as completed",
      });

      fetchReminders();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive",
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  useEffect(() => {
    fetchReminders();
  }, [studentId]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            AI Timetable Manager
          </CardTitle>
          <CardDescription>
            Get personalized study schedules and reminders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={generateSchedule} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Schedule...
              </>
            ) : (
              'Generate AI Study Schedule'
            )}
          </Button>

          {reminders.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Bell className="h-4 w-4" />
                Upcoming Study Sessions
              </div>

              {reminders.map((reminder) => (
                <Card key={reminder.schedule_id} className="border-l-4" style={{
                  borderLeftColor: `var(--${getPriorityColor(reminder.priority_level)})`
                }}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {reminder.subjects?.subject_name || 'Study Session'}
                          </p>
                          <Badge variant="outline" className={getPriorityColor(reminder.priority_level)}>
                            {reminder.priority_level}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(reminder.scheduled_time), 'MMM dd, hh:mm a')}
                          </span>
                          <span>{reminder.duration_minutes} min</span>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markCompleted(reminder.schedule_id)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {schedule.length > 0 && (
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-base">Generated Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(schedule, null, 2)}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AITimetableManager;