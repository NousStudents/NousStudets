import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  UserPlus,
  School,
  UserCheck,
  Settings,
  FileText,
  Building2,
  GraduationCap,
  Calendar,
  AlertCircle,
  Database,
  Shield,
  BookOpen
} from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { RecentActivities } from '@/components/admin/RecentActivities';
import { SystemStatus } from '@/components/admin/SystemStatus';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    activeUsers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const [studentsRes, teachersRes, classesRes, adminsRes, parentsRes] = await Promise.all([
        supabase.from('students').select('student_id', { count: 'exact', head: true }),
        supabase.from('teachers').select('teacher_id', { count: 'exact', head: true }),
        supabase.from('classes').select('class_id', { count: 'exact', head: true }),
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
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Admin Overview
        </h2>
        <p className="text-muted-foreground">
          Monitor system-wide activities and manage operations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-pastel-blue/30 border-pastel-blue/50">
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

        <Card className="bg-pastel-peach/30 border-pastel-peach/50">
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

        <Card className="bg-pastel-mint/30 border-pastel-mint/50">
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

        <Card className="bg-pastel-lavender/30 border-pastel-lavender/50">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Enhanced Admin Panel
          </CardTitle>
          <CardDescription>Quick access to essential management tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    Import students, teachers & parents
                  </p>
                </div>
              </div>
            </button>

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
                    Create & organize classes
                  </p>
                </div>
              </div>
            </button>

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
                    Create exam schedules
                  </p>
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <RecentActivities />
        <SystemStatus />
      </div>
    </div>
  );
}
