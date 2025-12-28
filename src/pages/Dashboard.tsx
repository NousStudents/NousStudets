import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, MessageCircle, Video, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProfileSheet } from '@/components/ProfileSheet';
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
  auth_user_id?: string;
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
    if (user && role) {
      fetchUserProfile();
    } else if (!user) {
      setProfile(null);
      setLoadingData(false);
    }
  }, [user, role]);

  const fetchUserProfile = async () => {
    setLoadingData(true);

    try {
      if (!user || !role) {
        setProfile(null);
        return;
      }

      let data: any = null;
      let school_id: string = '';

      if (role === 'admin') {
        const { data: adminData, error } = await supabase
          .from('admins')
          .select('admin_id, full_name, email, school_id, profile_image, auth_user_id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        if (error) throw error;
        if (!adminData) {
          setProfile(null);
          return;
        }
        data = { ...adminData, user_id: adminData.admin_id, auth_user_id: adminData.auth_user_id };
        school_id = adminData.school_id;
      } else if (role === 'teacher') {
        const { data: teacherData, error } = await supabase
          .from('teachers')
          .select('teacher_id, full_name, email, school_id, profile_image, auth_user_id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        if (error) throw error;
        if (!teacherData) {
          setProfile(null);
          return;
        }
        data = { ...teacherData, user_id: teacherData.teacher_id, auth_user_id: teacherData.auth_user_id };
        school_id = teacherData.school_id;
      } else if (role === 'student') {
        const { data: studentData, error } = await supabase
          .from('students')
          .select('student_id, full_name, email, class_id, profile_picture, auth_user_id, classes(school_id)')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        if (error) throw error;
        if (!studentData) {
          setProfile(null);
          return;
        }
        data = {
          ...studentData,
          user_id: studentData.student_id,
          auth_user_id: (studentData as any).auth_user_id,
          profile_image: studentData.profile_picture,
        };
        school_id = (studentData?.classes as any)?.school_id;
      } else if (role === 'parent') {
        const { data: parentData, error } = await supabase
          .from('parents')
          .select('parent_id, full_name, email, school_id, profile_image, auth_user_id')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        if (error) throw error;
        if (!parentData) {
          setProfile(null);
          return;
        }
        data = { ...parentData, user_id: parentData.parent_id, auth_user_id: parentData.auth_user_id };
        school_id = parentData.school_id;
      }

      if (data) {
        setProfile({ ...data, role, school_id });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading || roleLoading || loadingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-2 border-muted animate-pulse mx-auto" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-12 w-12 rounded-full border-t-2 border-primary animate-spin" />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">Loading your dashboard</p>
            <p className="text-sm text-muted-foreground">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

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
      
      <div className="min-h-screen bg-background">
        {/* Premium Header */}
        <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Logo & Greeting */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center">
                    <span className="text-lg font-bold text-white">N</span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm text-muted-foreground">{getGreeting()}</p>
                  <h1 className="text-lg font-semibold text-foreground tracking-tight">
                    {profile?.full_name?.split(' ')[0] || 'User'}
                  </h1>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link to="/messages">
                  <Button variant="ghost" size="icon" className="relative">
                    <MessageCircle className="h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/meetings">
                  <Button variant="ghost" size="icon">
                    <Video className="h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent-gold" />
                </Button>
                
                <div className="h-6 w-px bg-border mx-1" />
                
                <Avatar 
                  className="cursor-pointer ring-2 ring-border hover:ring-primary transition-all duration-200 h-10 w-10"
                  onClick={() => navigate('/profile')}
                >
                  <AvatarImage src={profile?.profile_image} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-medium">
                    {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 md:py-8">
          {renderDashboard()}
        </main>
      </div>
    </>
  );
};

export default Dashboard;
