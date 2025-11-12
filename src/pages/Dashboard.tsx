import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GraduationCap, Bell } from 'lucide-react';
import { ProfileSheet } from '@/components/ProfileSheet';
import { BackButton } from '@/components/BackButton';
import StudentDashboard from './dashboards/StudentDashboard';
import TeacherDashboard from './dashboards/TeacherDashboard';
import ParentDashboard from './dashboards/ParentDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  school_id: string;
  profile_image?: string;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const { role, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      if (!user || !role) return;

      let data: any = null;
      let school_id: string = '';

      // Fetch from role-specific table
      if (role === 'admin') {
        const { data: adminData, error } = await supabase
          .from('admins')
          .select('admin_id, full_name, email, school_id, profile_image')
          .eq('auth_user_id', user.id)
          .single();
        if (error) throw error;
        data = { ...adminData, user_id: adminData?.admin_id };
        school_id = adminData?.school_id;
      } else if (role === 'teacher') {
        const { data: teacherData, error } = await supabase
          .from('teachers')
          .select('teacher_id, full_name, email, school_id, profile_image')
          .eq('auth_user_id', user.id)
          .single();
        if (error) throw error;
        data = { ...teacherData, user_id: teacherData?.teacher_id };
        school_id = teacherData?.school_id;
      } else if (role === 'student') {
        const { data: studentData, error } = await supabase
          .from('students')
          .select('student_id, full_name, email, class_id, profile_picture, classes(school_id)')
          .eq('auth_user_id', user.id)
          .single();
        if (error) throw error;
        data = { 
          ...studentData, 
          user_id: studentData?.student_id,
          profile_image: studentData?.profile_picture 
        };
        school_id = (studentData?.classes as any)?.school_id;
      } else if (role === 'parent') {
        const { data: parentData, error } = await supabase
          .from('parents')
          .select('parent_id, full_name, email, school_id, profile_image')
          .eq('auth_user_id', user.id)
          .single();
        if (error) throw error;
        data = { ...parentData, user_id: parentData?.parent_id };
        school_id = parentData?.school_id;
      }

      if (data) {
        setProfile({ ...data, role, school_id });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading || roleLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Render role-specific dashboard component
  const renderDashboard = () => {
    switch (role) {
      case 'student':
        return <StudentDashboard profile={profile} />;
      case 'teacher':
        return <TeacherDashboard profile={profile} />;
      case 'parent':
        return <ParentDashboard profile={profile} />;
      case 'admin':
        return <AdminDashboard profile={profile} />;
      default:
        return (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Unknown role. Please contact administration.</p>
          </div>
        );
    }
  };

  return (
    <>
      <ProfileSheet open={profileSheetOpen} onOpenChange={setProfileSheetOpen} />
      
      <div className="min-h-screen bg-gradient-hero">
        {/* Header */}
        <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <BackButton to="/" />
              <div className="p-2 bg-primary rounded-xl">
                <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-foreground">Nous</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">School Management</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <div className="hidden md:flex flex-col items-end">
                <p className="text-sm font-medium text-foreground">{profile?.full_name}</p>
                <Badge variant="secondary" className="text-xs capitalize">{role}</Badge>
              </div>
              <Avatar 
                className="cursor-pointer hover:ring-2 ring-primary transition-all"
                onClick={() => navigate('/profile')}
              >
                <AvatarImage src={profile?.profile_image} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

        <main className="container mx-auto px-4 py-8">
          {renderDashboard()}
        </main>
      </div>
    </>
  );
};

export default Dashboard;
