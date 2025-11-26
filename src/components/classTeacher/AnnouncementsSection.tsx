import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Bell, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Announcement {
  announcement_id: string;
  title: string;
  content: string;
  created_at: string;
  teachers: {
    full_name: string;
  };
}

interface AnnouncementsSectionProps {
  classId: string;
}

export function AnnouncementsSection({ classId }: AnnouncementsSectionProps) {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, [classId]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('class_announcements')
        .select(`
          *,
          teachers (
            full_name
          )
        `)
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error: any) {
      toast.error('Failed to load announcements');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('teacher_id, school_id')
        .eq('auth_user_id', user?.id)
        .single();

      if (!teacherData) {
        toast.error('Teacher profile not found');
        return;
      }

      const { error } = await supabase.from('class_announcements').insert({
        class_id: classId,
        teacher_id: teacherData.teacher_id,
        title: title.trim(),
        content: content.trim(),
        school_id: teacherData.school_id
      });

      if (error) throw error;

      toast.success('Announcement created successfully');
      setTitle('');
      setContent('');
      setDialogOpen(false);
      fetchAnnouncements();
    } catch (error: any) {
      toast.error('Failed to create announcement');
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAnnouncement = async (announcementId: string) => {
    try {
      const { error } = await supabase
        .from('class_announcements')
        .delete()
        .eq('announcement_id', announcementId);

      if (error) throw error;

      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (error: any) {
      toast.error('Failed to delete announcement');
      console.error('Error:', error);
    }
  };

  if (loading) {
    return <Card><CardContent className="py-12 text-center">Loading...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Class Announcements</span>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Announcement</DialogTitle>
                <DialogDescription>
                  Post an announcement to your class students
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter announcement title"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter announcement details"
                    rows={5}
                  />
                </div>
                <Button onClick={createAnnouncement} disabled={submitting} className="w-full">
                  {submitting ? 'Creating...' : 'Create Announcement'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>Communicate important updates to your class</CardDescription>
      </CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No announcements yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map(announcement => (
              <div
                key={announcement.announcement_id}
                className="p-4 border rounded-lg space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{announcement.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Posted by {announcement.teachers.full_name} •{' '}
                      {format(new Date(announcement.created_at), 'PPp')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAnnouncement(announcement.announcement_id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <p className="text-sm whitespace-pre-wrap">{announcement.content}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
