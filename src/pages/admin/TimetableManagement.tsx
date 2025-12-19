import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Plus, Pencil, Trash2, School, Loader2 } from 'lucide-react';
import { BackButton } from '@/components/BackButton';

interface TimetableEntry {
  timetable_id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string | null;
  day_of_week: string;
  start_time: string;
  end_time: string;
  period_type_id?: string | null;
  period_name?: string | null;
  is_break?: boolean;
  room_number?: string | null;
  classes?: { class_name: string; section: string | null };
  subjects?: { subject_name: string };
  teacher_name?: string;
  period_type?: { type_name: string; color_code: string | null };
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export default function TimetableManagement() {
  const { toast } = useToast();
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [periodTypes, setPeriodTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

  const [formData, setFormData] = useState({
    class_id: '',
    subject_id: '',
    teacher_id: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
    period_type_id: '',
    period_name: '',
    is_break: false,
    room_number: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get admin's school_id first
      const { data: adminData } = await supabase
        .from('admins')
        .select('school_id')
        .single();

      const schoolId = adminData?.school_id;
      
      let timetableQuery = supabase
        .from('timetable')
        .select(`
          *,
          classes(class_name, section),
          subjects(subject_name),
          period_types(type_name, color_code)
        `)
        .order('day_of_week')
        .order('start_time');
        
      let classesQuery = supabase.from('classes').select('*').order('class_name');
      let subjectsQuery = supabase.from('subjects').select('*').order('subject_name');
      let teachersQuery = supabase.from('teachers').select('teacher_id, full_name');
      
      // Filter by school_id if available
      if (schoolId) {
        classesQuery = classesQuery.eq('school_id', schoolId);
        teachersQuery = teachersQuery.eq('school_id', schoolId);
      }

      const [timetableRes, classesRes, subjectsRes, teachersRes, periodTypesRes] = await Promise.all([
        timetableQuery,
        classesQuery,
        subjectsQuery,
        teachersQuery,
        supabase.from('period_types').select('*').order('type_name')
      ]);

      // Log any errors for debugging
      if (classesRes.error) console.error('Classes fetch error:', classesRes.error);
      if (subjectsRes.error) console.error('Subjects fetch error:', subjectsRes.error);
      if (teachersRes.error) console.error('Teachers fetch error:', teachersRes.error);

      // Enrich timetable with teacher names
      const teachersList = teachersRes.data || [];
      if (timetableRes.data) {
        const enrichedData = timetableRes.data.map((entry: any) => {
          const teacher = teachersList.find((t: any) => t.teacher_id === entry.teacher_id);
          return { 
            ...entry, 
            teacher_name: teacher?.full_name || 'N/A'
          };
        });
        setTimetableEntries(enrichedData);
      }

      setTeachers(teachersList);
      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
      setPeriodTypes(periodTypesRes.data || []);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Prepare data for submission
      const submitData: any = {
        class_id: formData.class_id || null,
        subject_id: formData.subject_id || null,
        teacher_id: formData.teacher_id || null,
        day_of_week: formData.day_of_week,
        start_time: formData.start_time,
        end_time: formData.end_time,
        period_type_id: formData.period_type_id || null,
        period_name: formData.period_name || null,
        is_break: formData.is_break || false,
        room_number: formData.room_number || null
      };

      if (editingEntry) {
        const { error } = await supabase
          .from('timetable')
          .update(submitData)
          .eq('timetable_id', editingEntry.timetable_id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Timetable entry updated successfully'
        });
      } else {
        const { error } = await supabase
          .from('timetable')
          .insert([submitData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Timetable entry created successfully'
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving timetable entry:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save timetable entry',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this timetable entry?')) return;

    try {
      const { error } = await supabase
        .from('timetable')
        .delete()
        .eq('timetable_id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Timetable entry deleted successfully'
      });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete timetable entry',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormData({
      class_id: entry.class_id,
      subject_id: entry.subject_id,
      teacher_id: entry.teacher_id || '',
      day_of_week: entry.day_of_week,
      start_time: entry.start_time,
      end_time: entry.end_time,
      period_type_id: entry.period_type_id || '',
      period_name: entry.period_name || '',
      is_break: entry.is_break || false,
      room_number: entry.room_number || ''
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      class_id: '',
      subject_id: '',
      teacher_id: '',
      day_of_week: '',
      start_time: '',
      end_time: '',
      period_type_id: '',
      period_name: '',
      is_break: false,
      room_number: ''
    });
    setEditingEntry(null);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading timetable data...</div>;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <BackButton to="/dashboard" />
          <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Timetable Management
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Create and manage class schedules
            </p>
          </div>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEntry ? 'Edit Schedule' : 'Add New Schedule'}</DialogTitle>
              <DialogDescription>
                {editingEntry ? 'Update the timetable entry' : 'Create a new timetable entry for a class'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="period_type_id">Period Type</Label>
                <Select
                  value={formData.period_type_id}
                  onValueChange={(value) => {
                    const selectedType = periodTypes.find(pt => pt.period_type_id === value);
                    const isBreak = selectedType?.type_name?.toLowerCase().includes('break') || 
                                  selectedType?.type_name?.toLowerCase().includes('breakfast') ||
                                  selectedType?.type_name?.toLowerCase().includes('lunch');
                    setFormData({ 
                      ...formData, 
                      period_type_id: value,
                      is_break: isBreak,
                      class_id: isBreak ? '' : formData.class_id,
                      subject_id: isBreak ? '' : formData.subject_id,
                      teacher_id: isBreak ? '' : formData.teacher_id
                    });
                  }}
                >
                  <SelectTrigger id="period_type_id">
                    <SelectValue placeholder="Select period type (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodTypes.map((type) => (
                      <SelectItem key={type.period_type_id} value={type.period_type_id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: type.color_code || '#6b7280' }}
                          />
                          {type.type_name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.is_break && (
                <div className="space-y-2">
                  <Label htmlFor="period_name">Period Name</Label>
                  <Input
                    id="period_name"
                    placeholder="e.g., Morning Break, Lunch"
                    value={formData.period_name}
                    onChange={(e) => setFormData({ ...formData, period_name: e.target.value })}
                  />
                </div>
              )}

              {!formData.is_break && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="class_id">Class {!formData.is_break && '*'}</Label>
                      <Select
                        value={formData.class_id}
                        onValueChange={(value) => {
                          setFormData({ ...formData, class_id: value, subject_id: '' });
                        }}
                        required={!formData.is_break}
                      >
                        <SelectTrigger id="class_id">
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.class_id} value={cls.class_id}>
                              {cls.class_name} {cls.section ? `- ${cls.section}` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject_id">Subject {!formData.is_break && '*'}</Label>
                      <Select
                        value={formData.subject_id}
                        onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                        required={!formData.is_break}
                        disabled={!formData.class_id}
                      >
                        <SelectTrigger id="subject_id">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects
                            .filter(s => s.class_id === formData.class_id)
                            .map((subject) => (
                              <SelectItem key={subject.subject_id} value={subject.subject_id}>
                                {subject.subject_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="teacher_id">Teacher</Label>
                      <Select
                        value={formData.teacher_id}
                        onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                      >
                        <SelectTrigger id="teacher_id">
                          <SelectValue placeholder="Select teacher (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.teacher_id} value={teacher.teacher_id}>
                              {teacher.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="room_number">Room Number</Label>
                      <Input
                        id="room_number"
                        placeholder="e.g., Room 101, Lab A"
                        value={formData.room_number}
                        onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="day_of_week">Day of Week *</Label>
                  <Select
                    value={formData.day_of_week}
                    onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
                    required
                  >
                    <SelectTrigger id="day_of_week">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map(day => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingEntry ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingEntry ? 'Update' : 'Create'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <School className="h-4 w-4 sm:h-5 sm:w-5" />
            Current Schedule
          </CardTitle>
          <CardDescription className="text-sm">
            View and manage all timetable entries
            {typeof window !== 'undefined' && window.innerWidth < 768 && (
              <span className="block mt-1 text-yellow-600">⚠️ Desktop required for editing</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timetableEntries.length > 0 ? (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Class</TableHead>
                      <TableHead className="min-w-[120px]">Subject</TableHead>
                      <TableHead className="min-w-[120px]">Teacher</TableHead>
                      <TableHead className="min-w-[100px]">Day</TableHead>
                      <TableHead className="min-w-[150px]">Time</TableHead>
                      <TableHead className="text-right min-w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
              <TableBody>
                {timetableEntries.map((entry) => (
                  <TableRow key={entry.timetable_id}>
                    <TableCell className="font-medium">
                      {entry.is_break ? (
                        <Badge 
                          variant="outline" 
                          style={{ 
                            borderColor: entry.period_type?.color_code || '#6b7280',
                            color: entry.period_type?.color_code || '#6b7280'
                          }}
                        >
                          {entry.period_name || entry.period_type?.type_name || 'Break'}
                        </Badge>
                      ) : (
                        <>
                          {entry.classes?.class_name} - {entry.classes?.section || 'A'}
                          {entry.room_number && (
                            <span className="text-xs text-muted-foreground ml-2">({entry.room_number})</span>
                          )}
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.is_break ? (
                        <span className="text-muted-foreground italic">—</span>
                      ) : (
                        entry.subjects?.subject_name || 'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.is_break ? (
                        <span className="text-muted-foreground italic">—</span>
                      ) : (
                        entry.teacher_name || 'N/A'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{entry.day_of_week}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {entry.start_time} - {entry.end_time}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(entry)}
                          disabled={typeof window !== 'undefined' && window.innerWidth < 768}
                          title={typeof window !== 'undefined' && window.innerWidth < 768 ? "Desktop required" : "Edit"}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDelete(entry.timetable_id)}
                          disabled={typeof window !== 'undefined' && window.innerWidth < 768}
                          title={typeof window !== 'undefined' && window.innerWidth < 768 ? "Desktop required" : "Delete"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No timetable entries yet</p>
              <p className="text-sm">Create your first schedule entry to get started</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
