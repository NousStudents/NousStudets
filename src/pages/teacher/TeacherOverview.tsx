import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Calendar, 
  CheckSquare, 
  BookOpen,
  MessageSquare,
  BarChart3
} from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { useAuth } from '@/contexts/AuthContext';
import TeacherRecentSubmissions from '@/components/TeacherRecentSubmissions';

export default function TeacherOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTeacherData();
    }
  }, [user]);

  const fetchTeacherData = async () => {
    try {
      const { data: teacherInfo } = await supabase
        .from('teachers')
        .select('teacher_id')
        .eq('auth_user_id', user?.id)
        .single();

      if (teacherInfo) {
        setTeacherId(teacherInfo.teacher_id);
        
        const { data: classTeacherData } = await supabase
          .from('classes')
          .select('class_id')
          .eq('class_teacher_id', teacherInfo.teacher_id)
          .limit(1);
        
        setIsClassTeacher((classTeacherData?.length || 0) > 0);
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Teacher Overview
        </h2>
        <p className="text-muted-foreground">
          Manage your classes and monitor student progress.
        </p>
      </div>

      {isClassTeacher && (
        <Card className="bg-gradient-to-r from-pastel-blue/20 to-pastel-mint/20 border-pastel-blue">
          <CardContent className="py-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Class Teacher Dashboard</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage attendance, leave requests, marks, and announcements
                  </p>
                </div>
              </div>
              <Button onClick={() => navigate('/class-teacher')}>
                Open Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Today's Schedule
            </CardTitle>
            <CardDescription>Monday, November 8, 2025</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { time: '09:00 - 10:00', class: 'Grade 9B', subject: 'Mathematics', room: 'Room 101' },
              { time: '10:15 - 11:15', class: 'Grade 10A', subject: 'Mathematics', room: 'Room 101' },
              { time: '11:30 - 12:30', class: 'Grade 8C', subject: 'Mathematics', room: 'Room 101' },
              { time: '14:00 - 15:00', class: 'Grade 10B', subject: 'Mathematics', room: 'Room 101' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                <div className="text-sm font-medium text-muted-foreground w-24">{item.time}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{item.class}</h4>
                  <p className="text-sm text-muted-foreground">{item.subject} • {item.room}</p>
                </div>
                <Button size="sm" variant="outline">Start</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {teacherId && <TeacherRecentSubmissions teacherId={teacherId} />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Access your most common tasks instantly</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/attendance')}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:scale-[1.02] hover:border-primary/50"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3 transition-colors group-hover:bg-primary/20">
                  <CheckSquare className="h-6 w-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">Mark Attendance</span>
              </div>
            </button>

            <button
              onClick={() => navigate('/assignments')}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:scale-[1.02] hover:border-secondary/50"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full bg-secondary/10 p-3 transition-colors group-hover:bg-secondary/20">
                  <BookOpen className="h-6 w-6 text-secondary" />
                </div>
                <span className="text-sm font-medium text-foreground">Create Assignment</span>
              </div>
            </button>

            <button
              onClick={() => navigate('/messages')}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:scale-[1.02] hover:border-accent/50"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full bg-accent/10 p-3 transition-colors group-hover:bg-accent/20">
                  <MessageSquare className="h-6 w-6 text-accent" />
                </div>
                <span className="text-sm font-medium text-foreground">Message Class</span>
              </div>
            </button>

            <button
              onClick={() => navigate('/exams')}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:scale-[1.02] hover:border-muted-foreground/50"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="rounded-full bg-muted p-3 transition-colors group-hover:bg-muted/80">
                  <BarChart3 className="h-6 w-6 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">View Reports</span>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
