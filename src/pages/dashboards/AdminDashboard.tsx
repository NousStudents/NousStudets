import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { RecentActivities } from '@/components/admin/RecentActivities';
import { SystemStatus } from '@/components/admin/SystemStatus';
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
  Database,
  Shield,
  Brain
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
        <Card className="bg-pastel-blue/30 border-pastel-blue/50 animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-pastel-blue" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-2">Active enrollments</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-peach/30 border-pastel-peach/50 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-pastel-coral" />
              Total Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{stats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground mt-2">Active faculty</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-mint/30 border-pastel-mint/50 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <School className="h-5 w-5 text-pastel-mint" />
              Total Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{stats.totalClasses}</div>
            <p className="text-xs text-muted-foreground mt-2">Active sections</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-lavender/30 border-pastel-lavender/50 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-pastel-lavender" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-pastel-yellow">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-2">Total system users</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Admin Panel - Quick Actions */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Enhanced Admin Panel
          </CardTitle>
          <CardDescription>Quick access to essential management tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Bulk Users Card */}
            <button
              onClick={() => navigate('/admin/bulk-users')}
              className="group relative overflow-hidden rounded-2xl border-2 border-pastel-blue/40 bg-pastel-blue/20 p-6 text-left transition-all hover:border-pastel-blue hover:shadow-lg hover:scale-105"
            >
              <div className="flex flex-col items-start gap-3">
                <div className="rounded-xl bg-pastel-blue/30 p-3">
                  <Users className="h-8 w-8 text-pastel-blue" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Bulk Users</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Import students, teachers & parents via CSV
                  </p>
                </div>
              </div>
            </button>

            {/* Whitelist Students Card */}
            <button
              onClick={() => navigate('/admin/allowed-students')}
              className="group relative overflow-hidden rounded-2xl border-2 border-pastel-yellow/40 bg-pastel-yellow/20 p-6 text-left transition-all hover:border-pastel-yellow hover:shadow-lg hover:scale-105"
            >
              <div className="flex flex-col items-start gap-3">
                <div className="rounded-xl bg-pastel-yellow/30 p-3">
                  <Shield className="h-8 w-8 text-pastel-yellow" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Whitelist Students</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pre-approve students for signup
                  </p>
                </div>
              </div>
            </button>

            {/* Whitelist Teachers Card */}
            <button
              onClick={() => navigate('/admin/whitelisted-teachers')}
              className="group relative overflow-hidden rounded-2xl border-2 border-blue-500/40 bg-blue-500/20 p-6 text-left transition-all hover:border-blue-500 hover:shadow-lg hover:scale-105"
            >
              <div className="flex flex-col items-start gap-3">
                <div className="rounded-xl bg-blue-500/30 p-3">
                  <BookOpen className="h-8 w-8 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Whitelist Teachers</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pre-approve teachers for signup
                  </p>
                </div>
              </div>
            </button>

            {/* Whitelist Parents Card */}
            <button
              onClick={() => navigate('/admin/whitelisted-parents')}
              className="group relative overflow-hidden rounded-2xl border-2 border-purple-500/40 bg-purple-500/20 p-6 text-left transition-all hover:border-purple-500 hover:shadow-lg hover:scale-105"
            >
              <div className="flex flex-col items-start gap-3">
                <div className="rounded-xl bg-purple-500/30 p-3">
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Whitelist Parents</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pre-approve parents for signup
                  </p>
                </div>
              </div>
            </button>

            {/* Classes Card */}
            <button
              onClick={() => navigate('/admin/classes')}
              className="group relative overflow-hidden rounded-2xl border-2 border-pastel-mint/40 bg-pastel-mint/20 p-6 text-left transition-all hover:border-pastel-mint hover:shadow-lg hover:scale-105"
            >
              <div className="flex flex-col items-start gap-3">
                <div className="rounded-xl bg-pastel-mint/30 p-3">
                  <School className="h-8 w-8 text-pastel-mint" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Classes</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create, organize & assign class teachers
                  </p>
                </div>
              </div>
            </button>

            {/* Exam Timetable Card */}
            <button
              onClick={() => navigate('/admin/exam-timetable')}
              className="group relative overflow-hidden rounded-2xl border-2 border-pastel-peach/40 bg-pastel-peach/20 p-6 text-left transition-all hover:border-pastel-peach hover:shadow-lg hover:scale-105"
            >
              <div className="flex flex-col items-start gap-3">
                <div className="rounded-xl bg-pastel-peach/30 p-3">
                  <FileText className="h-8 w-8 text-pastel-coral" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Exam Timetable</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Create & publish exam schedules
                  </p>
                </div>
              </div>
            </button>

            {/* Class Timetable Card */}
            <button
              onClick={() => navigate('/admin/weekly-timetable')}
              className="group relative overflow-hidden rounded-2xl border-2 border-pastel-lavender/40 bg-pastel-lavender/20 p-6 text-left transition-all hover:border-pastel-lavender hover:shadow-lg hover:scale-105"
            >
              <div className="flex flex-col items-start gap-3">
                <div className="rounded-xl bg-pastel-lavender/30 p-3">
                  <Calendar className="h-8 w-8 text-pastel-lavender" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">Class Timetable</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Design weekly schedules & periods
                  </p>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Standard Quick Actions */}
      <Card className="animate-slide-up">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Other administrative tasks</CardDescription>
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
              onClick={() => navigate('/admin/timetable')}
            >
              <Calendar className="h-7 w-7" />
              <span className="text-sm font-medium">View Timetable</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6 pb-20 md:pb-6">
        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-2 bg-card border border-border p-2 rounded-lg flex-wrap">
          <Button variant="secondary" size="sm" className="flex-1 min-w-[120px]" onClick={() => navigate('/admin/overview')}>
            Overview
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[120px]" onClick={() => navigate('/admin/users')}>
            User Management
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[120px]" onClick={() => navigate('/admin/academic')}>
            Academics
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[120px]" onClick={() => navigate('/admin/financial')}>
            Finance
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[120px]" onClick={() => navigate('/admin/reports')}>
            Reports
          </Button>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border">
          <div className="w-full h-auto grid grid-cols-5 gap-0">
            <button 
              className="flex-col gap-1.5 h-16 flex items-center justify-center hover:bg-accent transition-colors"
              onClick={() => navigate('/admin/overview')}
            >
              <Settings className="h-5 w-5" />
              <span className="text-[10px] font-medium">Overview</span>
            </button>
            <button 
              className="flex-col gap-1.5 h-16 flex items-center justify-center hover:bg-accent transition-colors"
              onClick={() => navigate('/admin/users')}
            >
              <Users className="h-5 w-5" />
              <span className="text-[10px] font-medium">Users</span>
            </button>
            <button 
              className="flex-col gap-1.5 h-16 flex items-center justify-center hover:bg-accent transition-colors"
              onClick={() => navigate('/admin/academic')}
            >
              <BookOpen className="h-5 w-5" />
              <span className="text-[10px] font-medium">Academics</span>
            </button>
            <button 
              className="flex-col gap-1.5 h-16 flex items-center justify-center hover:bg-accent transition-colors"
              onClick={() => navigate('/admin/financial')}
            >
              <DollarSign className="h-5 w-5" />
              <span className="text-[10px] font-medium">Finance</span>
            </button>
            <button 
              className="flex-col gap-1.5 h-16 flex items-center justify-center hover:bg-accent transition-colors"
              onClick={() => navigate('/admin/reports')}
            >
              <FileText className="h-5 w-5" />
              <span className="text-[10px] font-medium">Reports</span>
            </button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <RecentActivities />

            {/* System Status */}
            <SystemStatus />
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
