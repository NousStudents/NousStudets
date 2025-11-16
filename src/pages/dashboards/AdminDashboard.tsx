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
  UserCheck,
  Database
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
        <Card className="bg-gradient-blue-purple border-pastel-purple/30 animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-pastel-purple" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-2">Active enrollments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-pink-yellow border-pastel-pink/30 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-pastel-coral" />
              Total Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold bg-gradient-pink-yellow bg-clip-text text-transparent">{stats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground mt-2">Active faculty</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-green-blue border-pastel-green/30 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <School className="h-5 w-5 text-pastel-green" />
              Total Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold bg-gradient-green-blue bg-clip-text text-transparent">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground mt-2">Active sections</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-pastel-yellow/30 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-pastel-yellow" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-pastel-yellow">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-2">Total system users</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Button 
              variant="pastelPurple" 
              className="h-auto flex-col gap-3 py-5 rounded-2xl"
              onClick={() => navigate('/admin/school')}
            >
              <Building2 className="h-7 w-7" />
              <span className="text-sm font-medium">School</span>
            </Button>
            <Button 
              variant="pastelBlue" 
              className="h-auto flex-col gap-3 py-5 rounded-2xl"
              onClick={() => navigate('/admin/students')}
            >
              <GraduationCap className="h-7 w-7" />
              <span className="text-sm font-medium">Students</span>
            </Button>
            <Button 
              variant="pastelGreen" 
              className="h-auto flex-col gap-3 py-5 rounded-2xl"
              onClick={() => navigate('/admin/teachers')}
            >
              <UserCheck className="h-7 w-7" />
              <span className="text-sm font-medium">Teachers</span>
            </Button>
            <Button 
              variant="pastelPink" 
              className="h-auto flex-col gap-3 py-5 rounded-2xl"
              onClick={() => navigate('/admin/parents')}
            >
              <Users className="h-7 w-7" />
              <span className="text-sm font-medium">Parents</span>
            </Button>
            <Button
              variant="pastelYellow" 
              className="h-auto flex-col gap-3 py-5 rounded-2xl"
              onClick={() => navigate('/admin/users')}
            >
              <UserPlus className="h-7 w-7" />
              <span className="text-sm font-medium">Users</span>
            </Button>
            <Button 
              variant="pastelCoral" 
              className="h-auto flex-col gap-3 py-5 rounded-2xl"
              onClick={() => navigate('/admin/classes')}
            >
              <School className="h-7 w-7" />
              <span className="text-sm font-medium">Classes</span>
            </Button>
            <Button 
              variant="pastelPurple" 
              className="h-auto flex-col gap-3 py-5 rounded-2xl"
              onClick={() => navigate('/admin/timetable')}
            >
              <Calendar className="h-7 w-7" />
              <span className="text-sm font-medium">Timetable</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto flex-col gap-3 py-5 rounded-2xl border-2 border-pastel-coral/40 hover:bg-pastel-coral/10"
              onClick={() => navigate('/admin/cleanup')}
            >
              <AlertCircle className="h-7 w-7 text-pastel-coral" />
              <span className="text-sm font-medium">Cleanup</span>
            </Button>
            <Button 
              variant="pastelBlue" 
              className="h-auto flex-col gap-3 py-5 rounded-2xl"
              onClick={() => navigate('/admin/sql-editor')}
            >
              <Database className="h-7 w-7" />
              <span className="text-sm font-medium">SQL Editor</span>
            </Button>
            <Button 
              variant="pastelGreen" 
              className="h-auto flex-col gap-3 py-5 rounded-2xl"
              onClick={() => navigate('/exams')}
            >
              <FileText className="h-7 w-7" />
              <span className="text-sm font-medium">Exams</span>
            </Button>
          </div>
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
