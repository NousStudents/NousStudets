import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BackButton } from '@/components/BackButton';
import { Calendar, Clock, Plus, Save, Loader2 } from 'lucide-react';

interface TimeSlot {
  start_time: string;
  end_time: string;
}

interface TimetableCell {
  subject_id: string;
  teacher_id: string;
  subject_name?: string;
  teacher_name?: string;
}

interface WeeklySchedule {
  [classId: string]: {
    [day: string]: {
      [timeSlot: string]: TimetableCell;
    };
  };
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS: TimeSlot[] = [
  { start_time: '08:00', end_time: '09:00' },
  { start_time: '09:00', end_time: '10:00' },
  { start_time: '10:00', end_time: '11:00' },
  { start_time: '11:00', end_time: '12:00' },
  { start_time: '12:00', end_time: '13:00' },
  { start_time: '13:00', end_time: '14:00' },
  { start_time: '14:00', end_time: '15:00' },
  { start_time: '15:00', end_time: '16:00' },
];

export default function WeeklyTimetable() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesRes, subjectsRes, teachersRes, timetableRes] = await Promise.all([
        supabase.from('classes').select('*').order('class_name'),
        supabase.from('subjects').select('*').order('subject_name'),
        supabase.from('teachers').select('teacher_id, full_name'),
        supabase.from('timetable').select('*')
      ]);

      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
      setTeachers(teachersRes.data || []);

      // Build schedule from existing timetable
      const newSchedule: WeeklySchedule = {};
      (timetableRes.data || []).forEach((entry: any) => {
        if (!newSchedule[entry.class_id]) {
          newSchedule[entry.class_id] = {};
        }
        if (!newSchedule[entry.class_id][entry.day_of_week]) {
          newSchedule[entry.class_id][entry.day_of_week] = {};
        }
        const timeKey = `${entry.start_time}-${entry.end_time}`;
        newSchedule[entry.class_id][entry.day_of_week][timeKey] = {
          subject_id: entry.subject_id,
          teacher_id: entry.teacher_id
        };
      });

      setSchedule(newSchedule);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load timetable data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCell = (classId: string, day: string, timeSlot: TimeSlot, field: 'subject_id' | 'teacher_id', value: string) => {
    const timeKey = `${timeSlot.start_time}-${timeSlot.end_time}`;
    setSchedule(prev => ({
      ...prev,
      [classId]: {
        ...prev[classId],
        [day]: {
          ...prev[classId]?.[day],
          [timeKey]: {
            ...prev[classId]?.[day]?.[timeKey],
            [field]: value
          }
        }
      }
    }));
  };

  const saveTimetable = async () => {
    setSaving(true);
    try {
      // Delete existing timetable entries
      await supabase.from('timetable').delete().neq('timetable_id', '00000000-0000-0000-0000-000000000000');

      // Insert new entries
      const entries: any[] = [];
      Object.entries(schedule).forEach(([classId, classDays]) => {
        Object.entries(classDays).forEach(([day, daySlots]) => {
          Object.entries(daySlots).forEach(([timeKey, cell]) => {
            if (cell.subject_id && cell.teacher_id) {
              const [start_time, end_time] = timeKey.split('-');
              entries.push({
                class_id: classId,
                subject_id: cell.subject_id,
                teacher_id: cell.teacher_id,
                day_of_week: day,
                start_time,
                end_time
              });
            }
          });
        });
      });

      if (entries.length > 0) {
        const { error } = await supabase.from('timetable').insert(entries);
        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Weekly timetable saved successfully'
      });
    } catch (error) {
      console.error('Error saving timetable:', error);
      toast({
        title: 'Error',
        description: 'Failed to save timetable',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-8 w-8 text-pastel-mint" />
              Weekly Timetable Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage entire weekly schedule for all classes simultaneously
            </p>
          </div>
        </div>
        <Button onClick={saveTimetable} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save All Changes
        </Button>
      </div>

      <div className="space-y-8">
        {classes.map((classItem) => (
          <Card key={classItem.class_id} className="bg-pastel-blue/10 border-pastel-blue/30">
            <CardHeader>
              <CardTitle className="text-xl text-foreground">
                {classItem.class_name} {classItem.section && `- ${classItem.section}`}
              </CardTitle>
              <CardDescription>Configure weekly schedule for this class</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border border-border p-2 text-left text-sm font-medium">
                        <Clock className="inline h-4 w-4 mr-1" />
                        Time
                      </th>
                      {DAYS.map(day => (
                        <th key={day} className="border border-border p-2 text-center text-sm font-medium">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((slot) => (
                      <tr key={`${slot.start_time}-${slot.end_time}`}>
                        <td className="border border-border p-2 text-sm font-medium bg-muted/30">
                          {slot.start_time} - {slot.end_time}
                        </td>
                        {DAYS.map(day => {
                          const timeKey = `${slot.start_time}-${slot.end_time}`;
                          const cell = schedule[classItem.class_id]?.[day]?.[timeKey];
                          
                          return (
                            <td key={day} className="border border-border p-2">
                              <div className="space-y-2">
                                <Select
                                  value={cell?.subject_id || ''}
                                  onValueChange={(value) => updateCell(classItem.class_id, day, slot, 'subject_id', value)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Subject" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {subjects
                                      .filter(s => s.class_id === classItem.class_id)
                                      .map(subject => (
                                        <SelectItem key={subject.subject_id} value={subject.subject_id}>
                                          {subject.subject_name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                
                                <Select
                                  value={cell?.teacher_id || ''}
                                  onValueChange={(value) => updateCell(classItem.class_id, day, slot, 'teacher_id', value)}
                                  disabled={!cell?.subject_id}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Teacher" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {teachers.map(teacher => (
                                      <SelectItem key={teacher.teacher_id} value={teacher.teacher_id}>
                                        {teacher.full_name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
