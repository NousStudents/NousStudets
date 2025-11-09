import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, School, Users } from 'lucide-react';

interface TimetableEntry {
  timetable_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  subjects?: { subject_name: string };
  classes?: { class_name: string; section: string | null };
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TeacherTimetable({ teacherId }: { teacherId: string }) {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherTimetable();
  }, [teacherId]);

  const fetchTeacherTimetable = async () => {
    try {
      const { data: timetableData } = await supabase
        .from('timetable')
        .select(`
          *,
          subjects(subject_name),
          classes(class_name, section)
        `)
        .eq('teacher_id', teacherId)
        .order('day_of_week')
        .order('start_time');

      setTimetable(timetableData || []);
    } catch (error) {
      console.error('Error fetching teacher timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimetableForDay = (day: string) => {
    return timetable.filter(entry => entry.day_of_week === day);
  };

  if (loading) {
    return <div className="text-center py-8">Loading timetable...</div>;
  }

  if (timetable.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No classes assigned yet</p>
          <p className="text-sm">Your teaching schedule will appear here once created</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6">
        {DAYS.map((day) => {
          const daySchedule = getTimetableForDay(day);
          
          if (daySchedule.length === 0) return null;

          return (
            <Card key={day}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {day}
                </CardTitle>
                <CardDescription>{daySchedule.length} classes to teach</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {daySchedule.map((entry) => (
                    <div
                      key={entry.timetable_id}
                      className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground min-w-[100px]">
                        <Clock className="h-4 w-4" />
                        <span>
                          {entry.start_time} - {entry.end_time}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground flex items-center gap-2">
                          <School className="h-4 w-4 text-primary" />
                          {entry.subjects?.subject_name || 'N/A'}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {entry.classes?.class_name} - {entry.classes?.section || 'A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {Math.floor((new Date(`2000-01-01 ${entry.end_time}`).getTime() - 
                            new Date(`2000-01-01 ${entry.start_time}`).getTime()) / (1000 * 60))} min
                        </Badge>
                        <Button size="sm" variant="outline">
                          Start Class
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
