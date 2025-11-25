import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, BookOpen } from 'lucide-react';

interface TimetableEntry {
  timetable_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  teacher_id: string;
  subjects?: { subject_name: string };
  teacher_name?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export default function StudentTimetable({ studentId }: { studentId: string }) {
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentTimetable();
  }, [studentId]);

  const fetchStudentTimetable = async () => {
    try {
      // First get student's class_id
      const { data: studentData } = await supabase
        .from('students')
        .select('class_id')
        .eq('student_id', studentId)
        .single();

      if (!studentData?.class_id) {
        setLoading(false);
        return;
      }

      // Then fetch timetable for that class
      const { data: timetableData } = await supabase
        .from('timetable')
        .select(`
          *,
          subjects(subject_name)
        `)
        .eq('class_id', studentData.class_id)
        .order('day_of_week')
        .order('start_time');

      if (timetableData) {
        // Fetch teacher names separately
        const enrichedData = await Promise.all(
          timetableData.map(async (entry) => {
            const { data: teacherData } = await supabase
              .from('teachers')
              .select('full_name')
              .eq('teacher_id', entry.teacher_id)
              .single();

            return { ...entry, teacher_name: teacherData?.full_name };
          })
        );
        setTimetable(enrichedData);
      }
    } catch (error) {
      console.error('Error fetching student timetable:', error);
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
          <p className="text-lg">No timetable available yet</p>
          <p className="text-sm">Your class schedule will appear here once created</p>
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
                <CardDescription>{daySchedule.length} classes scheduled</CardDescription>
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
                          <BookOpen className="h-4 w-4 text-primary" />
                          {entry.subjects?.subject_name || 'N/A'}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {entry.teacher_name || 'Teacher TBA'}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {Math.floor((new Date(`2000-01-01 ${entry.end_time}`).getTime() - 
                          new Date(`2000-01-01 ${entry.start_time}`).getTime()) / (1000 * 60))} min
                      </Badge>
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
