import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BackButton } from '@/components/BackButton';
import { Calendar, Clock, Plus, Save, Loader2 } from 'lucide-react';
import { TimetableAutoGenerator } from '@/components/admin/TimetableAutoGenerator';
import { TimetableConflictDetector } from '@/components/admin/TimetableConflictDetector';
import { TimetableTemplateManager } from '@/components/admin/TimetableTemplateManager';

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

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { start_time: '08:00', end_time: '08:45' },
  { start_time: '08:45', end_time: '09:30' },
  { start_time: '09:30', end_time: '09:45' }, // Short Break
  { start_time: '09:45', end_time: '10:30' },
  { start_time: '10:30', end_time: '11:15' },
  { start_time: '11:15', end_time: '12:00' },
  { start_time: '12:00', end_time: '12:45' }, // Lunch Break
  { start_time: '12:45', end_time: '13:30' },
  { start_time: '13:30', end_time: '14:15' },
  { start_time: '14:15', end_time: '15:00' },
];

export default function WeeklyTimetable() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [periodTypes, setPeriodTypes] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentEntries, setCurrentEntries] = useState<any[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(DEFAULT_TIME_SLOTS);
  const [editingSlot, setEditingSlot] = useState<{ index: number } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get admin's school_id first for proper filtering
      const { data: adminData } = await supabase
        .from('admins')
        .select('school_id')
        .single();

      const schoolId = adminData?.school_id;
      
      let classesQuery = supabase.from('classes').select('*').order('class_name');
      let subjectsQuery = supabase.from('subjects').select('*').order('subject_name');
      let teachersQuery = supabase.from('teachers').select('teacher_id, full_name');
      let timetableQuery = supabase.from('timetable').select('*');
      
      // Filter by school_id if available
      if (schoolId) {
        classesQuery = classesQuery.eq('school_id', schoolId);
        teachersQuery = teachersQuery.eq('school_id', schoolId);
      }

      const [classesRes, subjectsRes, teachersRes, periodTypesRes, timetableRes] = await Promise.all([
        classesQuery,
        subjectsQuery,
        teachersQuery,
        supabase.from('period_types').select('*'),
        timetableQuery
      ]);

      // Log any errors for debugging
      if (classesRes.error) console.error('Classes fetch error:', classesRes.error);
      if (subjectsRes.error) console.error('Subjects fetch error:', subjectsRes.error);
      if (teachersRes.error) console.error('Teachers fetch error:', teachersRes.error);
      if (timetableRes.error) console.error('Timetable fetch error:', timetableRes.error);

      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
      setTeachers(teachersRes.data || []);
      setPeriodTypes(periodTypesRes.data || []);
      setCurrentEntries(timetableRes.data || []);

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

  const loadTemplate = (entries: any[]) => {
    // Convert entries to schedule format
    const newSchedule: WeeklySchedule = {};
    entries.forEach((entry: any) => {
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
    setCurrentEntries(entries);
  };

  const addTimeSlot = () => {
    const lastSlot = timeSlots[timeSlots.length - 1];
    const newStart = lastSlot.end_time;
    const [hours, minutes] = newStart.split(':').map(Number);
    const newEndHours = minutes + 45 >= 60 ? hours + 1 : hours;
    const newEndMinutes = (minutes + 45) % 60;
    const newEnd = `${String(newEndHours).padStart(2, '0')}:${String(newEndMinutes).padStart(2, '0')}`;
    
    setTimeSlots([...timeSlots, { start_time: newStart, end_time: newEnd }]);
  };

  const deleteTimeSlot = (index: number) => {
    if (timeSlots.length <= 1) {
      toast({
        title: 'Cannot Delete',
        description: 'At least one time slot is required',
        variant: 'destructive'
      });
      return;
    }
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, field: 'start_time' | 'end_time', value: string) => {
    const newSlots = [...timeSlots];
    newSlots[index][field] = value;
    setTimeSlots(newSlots);
    setEditingSlot(null);
  };

  const saveTimetable = async () => {
    setSaving(true);
    try {
      // Validate all entries have valid days
      const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      // Delete existing timetable entries
      await supabase.from('timetable').delete().neq('timetable_id', '00000000-0000-0000-0000-000000000000');

      // Insert new entries
      const entries: any[] = [];
      Object.entries(schedule).forEach(([classId, classDays]) => {
        Object.entries(classDays).forEach(([day, daySlots]) => {
          if (!validDays.includes(day)) {
            console.warn(`Invalid day: ${day}, skipping`);
            return;
          }
          
          Object.entries(daySlots).forEach(([timeKey, cell]) => {
            if (cell.subject_id && cell.teacher_id) {
              const [start_time, end_time] = timeKey.split('-');
              entries.push({
                class_id: classId,
                subject_id: cell.subject_id,
                teacher_id: cell.teacher_id,
                day_of_week: day,
                start_time,
                end_time,
                period_type_id: null,
                is_break: false,
                period_name: null,
                room_number: null
              });
            }
          });
        });
      });

      if (entries.length > 0) {
        const { error } = await supabase.from('timetable').insert(entries);
        if (error) throw error;
      }

      await fetchData(); // Refresh to update conflict detection
      
      toast({
        title: 'Success',
        description: 'Weekly timetable saved successfully'
      });
    } catch (error: any) {
      console.error('Error saving timetable:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save timetable',
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
    <div className="container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 pb-20 md:pb-6">
      {/* Responsive Header */}
      <div className="space-y-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <BackButton />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
              <Calendar className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-pastel-mint flex-shrink-0" />
              <span className="break-words">Weekly Timetable Management</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Manage entire weekly schedule for all classes
            </p>
          </div>
        </div>

        {/* Action Buttons - Responsive Layout */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="flex-1 sm:flex-initial">
            <TimetableTemplateManager
              currentTimetable={currentEntries}
              onLoadTemplate={loadTemplate}
            />
          </div>
          <div className="flex-1 sm:flex-initial">
            <TimetableAutoGenerator
              onGenerated={fetchData}
              currentEntries={currentEntries}
              classes={classes}
              subjects={subjects}
              teachers={teachers}
            />
          </div>
          <Button 
            onClick={saveTimetable} 
            disabled={saving} 
            className="gap-2 w-full sm:w-auto"
            size="default"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            <span className="hidden xs:inline">Save All Changes</span>
            <span className="inline xs:hidden">Save</span>
          </Button>
        </div>
      </div>

      {/* Time Slot Manager - Responsive */}
      <Card className="bg-pastel-peach/10 border-pastel-peach/30">
        <CardHeader className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Clock className="h-5 w-5 text-pastel-peach flex-shrink-0" />
              <span>Manage Time Slots</span>
            </CardTitle>
            <Button onClick={addTimeSlot} size="sm" className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add Slot
            </Button>
          </div>
          <CardDescription className="text-xs sm:text-sm">
            Edit period times for the entire school
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {timeSlots.map((slot, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-background rounded-lg border">
                <span className="font-medium text-sm min-w-[80px] flex-shrink-0">
                  Period {index + 1}
                </span>
                {editingSlot?.index === index ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={slot.start_time}
                      onChange={(e) => updateTimeSlot(index, 'start_time', e.target.value)}
                      className="px-3 py-2 border rounded text-sm bg-background flex-1"
                    />
                    <span className="text-center sm:mx-1">to</span>
                    <input
                      type="time"
                      value={slot.end_time}
                      onChange={(e) => updateTimeSlot(index, 'end_time', e.target.value)}
                      className="px-3 py-2 border rounded text-sm bg-background flex-1"
                    />
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setEditingSlot(null)}
                      className="w-full sm:w-auto"
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1">
                    <span className="text-sm font-medium flex-1">
                      {slot.start_time} - {slot.end_time}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({Math.floor((new Date(`2000-01-01 ${slot.end_time}`).getTime() - 
                        new Date(`2000-01-01 ${slot.start_time}`).getTime()) / 60000)} min)
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setEditingSlot({ index })}
                        className="flex-1 sm:flex-initial"
                      >
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => deleteTimeSlot(index)}
                        className="flex-1 sm:flex-initial"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conflict Detection */}
      {currentEntries.length > 0 && (
        <TimetableConflictDetector
          entries={currentEntries}
          classes={classes}
          subjects={subjects}
          teachers={teachers}
          onQuickFix={fetchData}
        />
      )}

      {/* Class Timetables - Responsive */}
      <div className="space-y-6 sm:space-y-8">
        {classes.map((classItem) => (
          <Card key={classItem.class_id} className="bg-pastel-blue/10 border-pastel-blue/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg sm:text-xl text-foreground break-words">
                {classItem.class_name} {classItem.section && `- ${classItem.section}`}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Configure weekly schedule for this class
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {/* Mobile: Stacked Day Cards */}
              <div className="sm:hidden space-y-4 p-4">
                {DAYS.map(day => (
                  <div key={day} className="border border-border rounded-lg p-3 bg-background">
                    <h3 className="font-semibold text-sm mb-3 text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {day}
                    </h3>
                    <div className="space-y-3">
                      {timeSlots.map((slot) => {
                        const timeKey = `${slot.start_time}-${slot.end_time}`;
                        const cell = schedule[classItem.class_id]?.[day]?.[timeKey];
                        
                        return (
                          <div key={timeKey} className="p-3 bg-muted/30 rounded-md space-y-2">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {slot.start_time} - {slot.end_time}
                            </div>
                            <Select
                              value={cell?.subject_id || ''}
                              onValueChange={(value) => updateCell(classItem.class_id, day, slot, 'subject_id', value)}
                            >
                              <SelectTrigger className="h-9 text-xs w-full">
                                <SelectValue placeholder="Select Subject" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="break">Break/Free Period</SelectItem>
                                {subjects
                                  .filter(s => s.class_id === classItem.class_id)
                                  .map(subject => (
                                    <SelectItem key={subject.subject_id} value={subject.subject_id}>
                                      {subject.subject_name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            
                            {cell?.subject_id && cell.subject_id !== 'break' && (
                              <Select
                                value={cell?.teacher_id || ''}
                                onValueChange={(value) => updateCell(classItem.class_id, day, slot, 'teacher_id', value)}
                              >
                                <SelectTrigger className="h-9 text-xs w-full">
                                  <SelectValue placeholder="Select Teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                  {teachers.map(teacher => (
                                    <SelectItem key={teacher.teacher_id} value={teacher.teacher_id}>
                                      {teacher.full_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop/Tablet: Table View */}
              <div className="hidden sm:block overflow-x-auto -mx-6 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="border border-border p-2 text-left text-xs sm:text-sm font-medium min-w-[120px] sticky left-0 bg-muted/50 z-10">
                          <Clock className="inline h-4 w-4 mr-1" />
                          Time
                        </th>
                        {DAYS.map(day => (
                          <th key={day} className="border border-border p-2 text-center text-xs sm:text-sm font-medium min-w-[180px]">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((slot) => (
                        <tr key={`${slot.start_time}-${slot.end_time}`}>
                          <td className="border border-border p-2 text-xs sm:text-sm font-medium bg-muted/30 sticky left-0 z-10">
                            <div className="whitespace-nowrap">
                              {slot.start_time} - {slot.end_time}
                            </div>
                          </td>
                          {DAYS.map(day => {
                            const timeKey = `${slot.start_time}-${slot.end_time}`;
                            const cell = schedule[classItem.class_id]?.[day]?.[timeKey];
                            
                            return (
                              <td key={day} className="border border-border p-2 min-w-[180px]">
                                <div className="space-y-2">
                                  <Select
                                    value={cell?.subject_id || ''}
                                    onValueChange={(value) => updateCell(classItem.class_id, day, slot, 'subject_id', value)}
                                  >
                                    <SelectTrigger className="h-8 text-xs w-full">
                                      <SelectValue placeholder="Subject" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="break">Break/Free Period</SelectItem>
                                      {subjects
                                        .filter(s => s.class_id === classItem.class_id)
                                        .map(subject => (
                                          <SelectItem key={subject.subject_id} value={subject.subject_id}>
                                            {subject.subject_name}
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  
                                  {cell?.subject_id && cell.subject_id !== 'break' && (
                                    <Select
                                      value={cell?.teacher_id || ''}
                                      onValueChange={(value) => updateCell(classItem.class_id, day, slot, 'teacher_id', value)}
                                    >
                                      <SelectTrigger className="h-8 text-xs w-full">
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
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
