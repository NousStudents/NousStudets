import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TeacherTimetable from '@/components/TeacherTimetable';
import { 
  Users, 
  Calendar, 
  CheckSquare, 
  BookOpen,
  FileText,
  MessageSquare,
  ClipboardList,
  BarChart3,
  Settings
} from 'lucide-react';

export default function TeacherDashboard({ profile }: { profile: any }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherData();
  }, [profile]);

  const fetchTeacherData = async () => {
    try {
      // Get teacher_id directly
      const { data: teacherInfo } = await supabase
        .from('teachers')
        .select('teacher_id')
        .eq('auth_user_id', profile.auth_user_id)
        .single();

      if (teacherInfo) {
        setTeacherId(teacherInfo.teacher_id);
      }

      const { data: classesData } = await supabase
        .from('classes')
        .select('*')
        .limit(5);
      
      setClasses(classesData || []);
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading teacher dashboard...</div>;
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-pastel-blue/30 border-pastel-blue/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-pastel-blue" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">156</div>
            <p className="text-xs text-muted-foreground mt-1">Across 5 classes</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-mint/30 border-pastel-mint/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-pastel-mint" />
              Today's Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">4</div>
            <p className="text-xs text-muted-foreground mt-1">Next: Grade 10A at 10:00</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-peach/30 border-pastel-peach/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-pastel-coral" />
              Pending Grading
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">12</div>
            <p className="text-xs text-muted-foreground mt-1">Submissions to review</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-green/30 border-pastel-green/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Avg Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">92%</div>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6 pb-20 md:pb-6">
        {/* Desktop Navigation */}
        <TabsList className="hidden md:flex bg-card border border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timetable">My Timetable</TabsTrigger>
          <TabsTrigger value="classes">My Classes</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
        </TabsList>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border">
          <TabsList className="w-full h-auto grid grid-cols-6 gap-0 bg-transparent rounded-none p-0">
            <TabsTrigger 
              value="overview" 
              className="flex-col gap-1 h-16 rounded-none data-[state=active]:bg-primary/10"
            >
              <BookOpen className="h-5 w-5" />
              <span className="text-xs">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="timetable" 
              className="flex-col gap-1 h-16 rounded-none data-[state=active]:bg-primary/10"
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs">Timetable</span>
            </TabsTrigger>
            <TabsTrigger 
              value="classes" 
              className="flex-col gap-1 h-16 rounded-none data-[state=active]:bg-primary/10"
            >
              <Users className="h-5 w-5" />
              <span className="text-xs">Classes</span>
            </TabsTrigger>
            <TabsTrigger 
              value="assignments" 
              className="flex-col gap-1 h-16 rounded-none data-[state=active]:bg-primary/10"
            >
              <BookOpen className="h-5 w-5" />
              <span className="text-xs">Assignments</span>
            </TabsTrigger>
            <TabsTrigger 
              value="attendance" 
              className="flex-col gap-1 h-16 rounded-none data-[state=active]:bg-primary/10"
            >
              <CheckSquare className="h-5 w-5" />
              <span className="text-xs">Attendance</span>
            </TabsTrigger>
            <TabsTrigger 
              value="students" 
              className="flex-col gap-1 h-16 rounded-none data-[state=active]:bg-primary/10"
            >
              <Users className="h-5 w-5" />
              <span className="text-xs">Students</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Today's Schedule */}
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

            {/* Recent Submissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-secondary" />
                  Recent Submissions
                </CardTitle>
                <CardDescription>Pending review</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { student: 'Priya Sharma', assignment: 'Algebra Worksheet 5', submitted: '2 hours ago' },
                  { student: 'Rahul Kumar', assignment: 'Geometry Problems', submitted: '4 hours ago' },
                  { student: 'Anita Patel', assignment: 'Calculus Assignment', submitted: '1 day ago' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{item.student}</h4>
                      <p className="text-sm text-muted-foreground">{item.assignment}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.submitted}</p>
                    </div>
                    <Badge variant="secondary">Grade</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common teaching tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                  <CheckSquare className="h-6 w-6" />
                  <span className="text-sm">Mark Attendance</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                  <BookOpen className="h-6 w-6" />
                  <span className="text-sm">Create Assignment</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                  <MessageSquare className="h-6 w-6" />
                  <span className="text-sm">Message Class</span>
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                  <BarChart3 className="h-6 w-6" />
                  <span className="text-sm">View Reports</span>
                </Button>
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
