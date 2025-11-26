import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Check, X, Minus, Calendar as CalendarIcon } from 'lucide-react';

interface Student {
  student_id: string;
  full_name: string;
  roll_no: string | null;
  status?: 'present' | 'absent' | 'late' | null;
}

interface AttendanceSectionProps {
  classId: string;
}

export function AttendanceSection({ classId }: AttendanceSectionProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudentsWithAttendance();
  }, [classId, date]);

  const fetchStudentsWithAttendance = async () => {
    setLoading(true);
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('student_id, full_name, roll_no')
        .eq('class_id', classId)
        .order('roll_no', { ascending: true });

      if (studentsError) throw studentsError;

      // Fetch attendance for selected date
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('class_id', classId)
        .eq('date', format(date, 'yyyy-MM-dd'));

      const attendanceMap = new Map(
        attendanceData?.map(a => [a.student_id, a.status as 'present' | 'absent' | 'late']) || []
      );

      const studentsWithStatus = studentsData?.map(student => ({
        ...student,
        status: attendanceMap.get(student.student_id) || null
      })) || [];

      setStudents(studentsWithStatus);
    } catch (error: any) {
      toast.error('Failed to load students');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAttendanceStatus = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setStudents(prev =>
      prev.map(s => s.student_id === studentId ? { ...s, status } : s)
    );
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const attendanceRecords = students
        .filter(s => s.status)
        .map(s => ({
          class_id: classId,
          student_id: s.student_id,
          date: format(date, 'yyyy-MM-dd'),
          status: s.status
        }));

      // Delete existing attendance for this date
      await supabase
        .from('attendance')
        .delete()
        .eq('class_id', classId)
        .eq('date', format(date, 'yyyy-MM-dd'));

      // Insert new attendance records
      const { error } = await supabase
        .from('attendance')
        .insert(attendanceRecords);

      if (error) throw error;

      toast.success('Attendance saved successfully');
    } catch (error: any) {
      toast.error('Failed to save attendance');
      console.error('Error:', error);
    } finally {
      setSaving(false);
    }
  };

  const markAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'present' as const })));
  };

  const markAllAbsent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'absent' as const })));
  };

  if (loading) {
    return <Card><CardContent className="py-12 text-center">Loading...</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        {/* Attendance Marking */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Mark Attendance - {format(date, 'PPP')}</CardTitle>
            <CardDescription>
              Total Students: {students.length} | Present: {students.filter(s => s.status === 'present').length}
            </CardDescription>
            <div className="flex flex-wrap gap-2 pt-4">
              <Button onClick={markAllPresent} variant="outline" size="sm">
                Mark All Present
              </Button>
              <Button onClick={markAllAbsent} variant="outline" size="sm">
                Mark All Absent
              </Button>
              <Button onClick={saveAttendance} disabled={saving} className="ml-auto">
                {saving ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {students.map(student => (
                <div
                  key={student.student_id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-muted-foreground min-w-[60px]">
                      {student.roll_no || '-'}
                    </span>
                    <span className="font-medium">{student.full_name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={student.status === 'present' ? 'default' : 'outline'}
                      onClick={() => updateAttendanceStatus(student.student_id, 'present')}
                      className="min-w-[90px]"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Present
                    </Button>
                    <Button
                      size="sm"
                      variant={student.status === 'late' ? 'default' : 'outline'}
                      onClick={() => updateAttendanceStatus(student.student_id, 'late')}
                      className="min-w-[90px]"
                    >
                      <Minus className="h-4 w-4 mr-1" />
                      Late
                    </Button>
                    <Button
                      size="sm"
                      variant={student.status === 'absent' ? 'destructive' : 'outline'}
                      onClick={() => updateAttendanceStatus(student.student_id, 'absent')}
                      className="min-w-[90px]"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Absent
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
