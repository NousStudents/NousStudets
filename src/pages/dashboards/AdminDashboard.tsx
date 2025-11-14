import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Users, 
  UserPlus,
  School,
  BookOpen,
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Settings,
  FileText,
  Building2,
  GraduationCap,
  UserCheck
} from 'lucide-react';

export default function AdminDashboard({ profile }: { profile: any }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminStats();
  }, [profile]);

  const fetchAdminStats = async () => {
    try {
      const [studentsRes, teachersRes, classesRes] = await Promise.all([
        supabase.from('students').select('student_id', { count: 'exact', head: true }),
        supabase.from('teachers').select('teacher_id', { count: 'exact', head: true }),
        supabase.from('classes').select('class_id', { count: 'exact', head: true })
      ]);

      // Calculate total active users from all role tables
      const [adminsRes, parentsRes] = await Promise.all([
        supabase.from('admins').select('admin_id', { count: 'exact', head: true }),
        supabase.from('parents').select('parent_id', { count: 'exact', head: true })
      ]);

      const totalUsers = (studentsRes.count || 0) + (teachersRes.count || 0) + 
                        (adminsRes.count || 0) + (parentsRes.count || 0);

      setStats({
        totalStudents: studentsRes.count || 0,
        totalTeachers: teachersRes.count || 0,
        totalClasses: classesRes.count || 0,
        activeUsers: totalUsers
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading admin dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Admin Dashboard
        </h2>
        <p className="text-muted-foreground">
          Manage your school operations and monitor system-wide activities.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Active enrollments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-secondary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Total Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground mt-1">Active faculty</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-success/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <School className="h-4 w-4" />
              Total Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground mt-1">Active sections</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-warning/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Total system users</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 py-4"
              onClick={() => isMobile ? undefined : navigate('/admin/school')}
              disabled={isMobile}
              title={isMobile ? "Desktop required for school management" : ""}
            >
              <Building2 className="h-6 w-6" />
              <span className="text-sm">School</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 py-4"
              onClick={() => isMobile ? undefined : navigate('/admin/students')}
              disabled={isMobile}
              title={isMobile ? "Desktop required for student management" : ""}
            >
              <GraduationCap className="h-6 w-6" />
              <span className="text-sm">Students</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 py-4"
              onClick={() => isMobile ? undefined : navigate('/admin/teachers')}
              disabled={isMobile}
              title={isMobile ? "Desktop required for teacher management" : ""}
            >
              <UserCheck className="h-6 w-6" />
              <span className="text-sm">Teachers</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 py-4"
              onClick={() => isMobile ? undefined : navigate('/admin/parents')}
              disabled={isMobile}
              title={isMobile ? "Desktop required for parent management" : ""}
            >
              <Users className="h-6 w-6" />
              <span className="text-sm">Parents</span>
            </Button>
            <Button
              variant="outline" 
              className="h-auto flex-col gap-2 py-4"
              onClick={() => isMobile ? undefined : navigate('/admin/users')}
              disabled={isMobile}
              title={isMobile ? "Desktop required for user management" : ""}
            >
              <UserPlus className="h-6 w-6" />
              <span className="text-sm">Users</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 py-4"
              onClick={() => isMobile ? undefined : navigate('/admin/classes')}
              disabled={isMobile}
              title={isMobile ? "Desktop required for class management" : ""}
            >
              <School className="h-6 w-6" />
              <span className="text-sm">Classes</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 py-4"
              onClick={() => isMobile ? undefined : navigate('/admin/timetable')}
              disabled={isMobile}
              title={isMobile ? "Desktop required for timetable management" : ""}
            >
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Timetable</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 py-4"
              onClick={() => isMobile ? undefined : navigate('/admin/cleanup')}
              disabled={isMobile}
              title={isMobile ? "Desktop required for database cleanup" : ""}
            >
              <AlertCircle className="h-6 w-6" />
              <span className="text-sm">Cleanup</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-2 py-4"
              onClick={() => navigate('/exams')}
            >
              <FileText className="h-6 w-6" />
              <span className="text-sm">Exams</span>
            </Button>
          </div>
          {isMobile && (
            <p className="text-sm text-muted-foreground mt-4 text-center">
              ℹ️ Management actions require desktop
            </p>
          )}
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6 pb-20 md:pb-6">
        {/* Desktop Navigation */}
        <TabsList className="hidden md:flex bg-card border border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="academics">Academics</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border">
          <TabsList className="w-full h-auto grid grid-cols-5 gap-0 bg-transparent rounded-none p-0">
            <TabsTrigger 
              value="overview" 
              className="flex-col gap-1 h-16 rounded-none data-[state=active]:bg-primary/10"
            >
              <Settings className="h-5 w-5" />
              <span className="text-xs">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="flex-col gap-1 h-16 rounded-none data-[state=active]:bg-primary/10"
            >
              <Users className="h-5 w-5" />
              <span className="text-xs">Users</span>
            </TabsTrigger>
            <TabsTrigger 
              value="academics" 
              className="flex-col gap-1 h-16 rounded-none data-[state=active]:bg-primary/10"
            >
              <BookOpen className="h-5 w-5" />
              <span className="text-xs">Academics</span>
            </TabsTrigger>
            <TabsTrigger 
              value="finance" 
              className="flex-col gap-1 h-16 rounded-none data-[state=active]:bg-primary/10"
            >
              <DollarSign className="h-5 w-5" />
              <span className="text-xs">Finance</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="flex-col gap-1 h-16 rounded-none data-[state=active]:bg-primary/10"
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs">Reports</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  Recent Activities
                </CardTitle>
                <CardDescription>Latest system events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { action: 'New student enrolled', user: 'Admin', time: '10 minutes ago' },
                  { action: 'Timetable updated', user: 'Admin', time: '2 hours ago' },
                  { action: 'Fee payment received', user: 'System', time: '3 hours ago' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{item.action}</h4>
                      <p className="text-sm text-muted-foreground">By {item.user}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-secondary" />
                  System Status
                </CardTitle>
                <CardDescription>Platform health indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { metric: 'Database', status: 'Operational', color: 'success' },
                  { metric: 'Authentication', status: 'Operational', color: 'success' },
                  { metric: 'File Storage', status: 'Operational', color: 'success' },
                  { metric: 'Notifications', status: 'Operational', color: 'success' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="font-medium text-foreground">{item.metric}</span>
                    <Badge variant="secondary" className="bg-success/10 text-success">
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage students, teachers, and staff</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button 
                  className="w-full md:w-auto"
                  onClick={() => isMobile ? undefined : navigate('/admin/users')}
                  disabled={isMobile}
                  title={isMobile ? "Desktop required for user management" : ""}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create New User
                </Button>
                {isMobile && (
                  <p className="text-sm text-muted-foreground text-center">
                    ℹ️ User creation requires desktop
                  </p>
                )}
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">User listing and management coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academics">
          <Card>
            <CardHeader>
              <CardTitle>Academic Management</CardTitle>
              <CardDescription>Manage classes, subjects, and curriculum</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Academic management tools coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance">
          <Card>
            <CardHeader>
              <CardTitle>Finance Management</CardTitle>
              <CardDescription>Track fees, expenses, and payroll</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Financial management coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>System Reports</CardTitle>
              <CardDescription>Generate and view comprehensive reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Reporting system coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
