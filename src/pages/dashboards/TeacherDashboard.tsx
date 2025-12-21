import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import TeacherTimetable from '@/components/TeacherTimetable';
import TeacherRecentSubmissions from '@/components/TeacherRecentSubmissions';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  Calendar,
  CheckSquare,
  BookOpen,
  FileText,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export default function TeacherDashboard({ profile }: { profile: any | null }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [classes, setClasses] = useState<any[]>([]);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClassTeacher, setIsClassTeacher] = useState(false);

  const authUserId = useMemo(() => profile?.auth_user_id ?? user?.id ?? null, [profile, user]);

  useEffect(() => {
    if (!authUserId) {
      setLoading(false);
      return;
    }

    fetchTeacherData(authUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUserId]);

  const fetchTeacherData = async (auth_user_id: string) => {
    try {
      // Get teacher_id directly
      const { data: teacherInfo, error: teacherError } = await supabase
        .from('teachers')
        .select('teacher_id')
        .eq('auth_user_id', auth_user_id)
        .maybeSingle();

      if (teacherError) throw teacherError;

      if (!teacherInfo?.teacher_id) {
        setTeacherId(null);
        setIsClassTeacher(false);
        setClasses([]);
        return;
      }

      setTeacherId(teacherInfo.teacher_id);

      // Check if teacher is a class teacher
      const { data: classTeacherData, error: classTeacherError } = await supabase
        .from('classes')
        .select('class_id')
        .eq('class_teacher_id', teacherInfo.teacher_id)
        .limit(1);

      if (classTeacherError) throw classTeacherError;
      setIsClassTeacher((classTeacherData?.length || 0) > 0);

      // Get classes from timetable AND subjects assignments
      const [timetableData, subjectsData] = await Promise.all([
        supabase
          .from('timetable')
          .select(
            `
              class_id,
              classes (
                class_id,
                class_name,
                section
              )
            `
          )
          .eq('teacher_id', teacherInfo.teacher_id),
        supabase
          .from('subjects')
          .select(
            `
              class_id,
              classes (
                class_id,
                class_name,
                section
              )
            `
          )
          .eq('teacher_id', teacherInfo.teacher_id)
      ]);

      // Combine classes from timetable and subjects
      const classesMap = new Map<string, any>();
      
      if (timetableData.data) {
        timetableData.data.forEach((t) => {
          if (t.classes) {
            classesMap.set((t.classes as any).class_id, t.classes);
          }
        });
      }
      
      if (subjectsData.data) {
        subjectsData.data.forEach((s) => {
          if (s.classes) {
            classesMap.set((s.classes as any).class_id, s.classes);
          }
        });
      }
      
      setClasses(Array.from(classesMap.values()));
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading teacher dashboard...</div>;
  }

  if (!authUserId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Unable to load your teacher profile. Please sign out and sign in again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Welcome, {profile?.full_name?.split(' ')[0]}!
        </h2>
        <p className="text-muted-foreground">
          Manage your classes, assignments, and student progress.
        </p>
      </div>

      {/* Stats Cards - Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-pastel-blue/30 border-pastel-blue/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-pastel-blue" />
              My Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{classes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Assigned classes</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6 pb-20 md:pb-6">
        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-2 bg-card border border-border p-2 rounded-lg flex-wrap">
          <Button variant="secondary" size="sm" className="flex-1 min-w-[100px]" onClick={() => navigate('/teacher/overview')}>
            Overview
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[100px]" onClick={() => navigate('/teacher/academic')}>
            Academic
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[100px]" onClick={() => navigate('/timetable')}>
            Timetable
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[100px]" onClick={() => navigate('/teacher/classes')}>
            Classes
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[100px]" onClick={() => navigate('/teacher/subjects')}>
            Subjects
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[100px]" onClick={() => navigate('/assignments')}>
            Assignments
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[100px]" onClick={() => navigate('/attendance')}>
            Attendance
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[100px]" onClick={() => navigate('/teacher/students')}>
            Students
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[100px]" onClick={() => navigate('/messages')}>
            Messages
          </Button>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border">
          <div className="w-full h-auto grid grid-cols-6 gap-0">
            <button 
              className="flex-col gap-1.5 h-16 flex items-center justify-center hover:bg-accent transition-colors"
              onClick={() => navigate('/teacher/overview')}
            >
              <BookOpen className="h-5 w-5" />
              <span className="text-[10px] font-medium">Overview</span>
            </button>
            <button 
              className="flex-col gap-1.5 h-16 flex items-center justify-center hover:bg-accent transition-colors"
              onClick={() => navigate('/timetable')}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-[10px] font-medium">Timetable</span>
            </button>
            <button 
              className="flex-col gap-1.5 h-16 flex items-center justify-center hover:bg-accent transition-colors"
              onClick={() => navigate('/teacher/classes')}
            >
              <Users className="h-5 w-5" />
              <span className="text-[10px] font-medium">Classes</span>
            </button>
            <button 
              className="flex-col gap-1.5 h-16 flex items-center justify-center hover:bg-accent transition-colors"
              onClick={() => navigate('/assignments')}
            >
              <FileText className="h-5 w-5" />
              <span className="text-[10px] font-medium">Assignments</span>
            </button>
            <button 
              className="flex-col gap-1.5 h-16 flex items-center justify-center hover:bg-accent transition-colors"
              onClick={() => navigate('/attendance')}
            >
              <CheckSquare className="h-5 w-5" />
              <span className="text-[10px] font-medium">Attendance</span>
            </button>
            <button 
              className="flex-col gap-1.5 h-16 flex items-center justify-center hover:bg-accent transition-colors"
              onClick={() => navigate('/teacher/students')}
            >
              <Users className="h-5 w-5" />
              <span className="text-[10px] font-medium">Students</span>
            </button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Class Teacher Dashboard Link */}
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
                        Manage attendance, leave requests, marks, and announcements for your class
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
            {/* My Classes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  My Classes
                </CardTitle>
                <CardDescription>Classes you're assigned to</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {classes.length > 0 ? (
                  classes.map((cls) => (
                    <div key={cls.class_id} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{cls.class_name}</h4>
                        <p className="text-sm text-muted-foreground">Section: {cls.section || 'A'}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => navigate('/teacher/classes')}>View</Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No classes assigned yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Submissions */}
            {teacherId && <TeacherRecentSubmissions teacherId={teacherId} />}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Access your most common tasks instantly</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => navigate('/teacher/ai-assistant')}
                  className="group relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-primary/10 to-primary/5 p-6 transition-all hover:shadow-lg hover:scale-[1.02] hover:border-primary/50"
                >
                  <div className="flex flex-col items-center gap-3">
                    <div className="rounded-full bg-primary/20 p-3 transition-colors group-hover:bg-primary/30">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">AI Assistant</span>
                  </div>
                </button>

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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timetable">
          {teacherId ? (
            <TeacherTimetable teacherId={teacherId} />
          ) : (
            <Card>
              <CardContent className="text-center py-12 text-muted-foreground">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Unable to load timetable</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <CardHeader>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>Manage your assigned classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classes.length > 0 ? (
                  classes.map((cls) => (
                    <div key={cls.class_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold text-foreground">{cls.class_name}</h4>
                        <p className="text-sm text-muted-foreground">Section: {cls.section || 'A'}</p>
                      </div>
                      <Button variant="outline">View Details</Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">No classes assigned yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>Manage Assignments</CardTitle>
              <CardDescription>Create and grade assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Assignment management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Management</CardTitle>
              <CardDescription>Mark and track student attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <CheckSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Attendance marking coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Student Directory</CardTitle>
              <CardDescription>View and manage student profiles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Student directory coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
