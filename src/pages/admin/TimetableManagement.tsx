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
import { Calendar, Clock, Plus, Pencil, Trash2, School } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { MobileAdminRestriction } from '@/components/MobileAdminRestriction';

interface TimetableEntry {
  timetable_id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  classes?: { class_name: string; section: string | null };
  subjects?: { subject_name: string };
  teacher_name?: string;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TimetableManagement() {
  const { toast } = useToast();
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

  const [formData, setFormData] = useState({
    class_id: '',
    subject_id: '',
    teacher_id: '',
    day_of_week: '',
    start_time: '',
    end_time: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [timetableRes, classesRes, subjectsRes, teachersRes] = await Promise.all([
        supabase
          .from('timetable')
          .select(`
            *,
            classes(class_name, section),
            subjects(subject_name)
          `)
          .order('day_of_week')
          .order('start_time'),
        supabase.from('classes').select('*').order('class_name'),
        supabase.from('subjects').select('*').order('subject_name'),
        supabase.from('teachers').select('teacher_id, full_name')
      ]);

      // Enrich timetable with teacher names
      if (timetableRes.data && teachersRes.data) {
        const teacherMap = new Map(
          teachersRes.data.map((t: any) => [t.teacher_id, t.full_name])
        );
        
        const enrichedData = timetableRes.data.map((entry: any) => ({
          ...entry,
          teacher_name: teacherMap.get(entry.teacher_id) || 'N/A'
        }));
        setTimetableEntries(enrichedData);
      }

      // Format teachers for dropdown
      if (teachersRes.data) {
        const formattedTeachers = teachersRes.data.map((teacher: any) => ({
          teacher_id: teacher.teacher_id,
          users: { full_name: teacher.full_name }
        }));
        setTeachers(formattedTeachers);
      }

      setClasses(classesRes.data || []);
      setSubjects(subjectsRes.data || []);
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
      if (editingEntry) {
        const { error } = await supabase
          .from('timetable')
          .update(formData)
          .eq('timetable_id', editingEntry.timetable_id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Timetable entry updated successfully'
        });
      } else {
        const { error } = await supabase
          .from('timetable')
          .insert([formData]);

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
      teacher_id: entry.teacher_id,
      day_of_week: entry.day_of_week,
      start_time: entry.start_time,
      end_time: entry.end_time
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
      end_time: ''
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
        
        <MobileAdminRestriction action="add or edit timetable entries">
          <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Schedule
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? 'Edit Timetable Entry' : 'Add New Timetable Entry'}
              </DialogTitle>
              <DialogDescription>
                {editingEntry 
                  ? 'Update the schedule details below'
                  : 'Fill in the details to create a new schedule entry'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="class_id">Class</Label>
                  <Select
                    value={formData.class_id}
                    onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.class_id} value={cls.class_id}>
                          {cls.class_name} - {cls.section || 'A'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject_id">Subject</Label>
                  <Select
                    value={formData.subject_id}
                    onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.subject_id} value={subject.subject_id}>
                          {subject.subject_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teacher_id">Teacher</Label>
                  <Select
                    value={formData.teacher_id}
                    onValueChange={(value) => setFormData({ ...formData, teacher_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.teacher_id} value={teacher.teacher_id}>
                          {teacher.users?.full_name || 'Unknown'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="day_of_week">Day of Week</Label>
                  <Select
                    value={formData.day_of_week}
                    onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
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
                <Button type="button" variant="outline" onClick={() => handleDialogChange(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEntry ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </MobileAdminRestriction>
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
                      {entry.classes?.class_name} - {entry.classes?.section || 'A'}
                    </TableCell>
                    <TableCell>{entry.subjects?.subject_name}</TableCell>
                    <TableCell>{entry.teacher_name || 'N/A'}</TableCell>
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
