import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, MessageCircle, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProfileSheet } from '@/components/ProfileSheet';
import StudentDashboard from './dashboards/StudentDashboard';
import TeacherDashboard from './dashboards/TeacherDashboard';
import ParentDashboard from './dashboards/ParentDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import { useState } from 'react';

// Profile interface matching what sub-dashboards expect
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
  const navigate = useNavigate();
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Map AuthContext user to legacy profile format for sub-dashboards
  const profile: UserProfile | null = user ? {
    user_id: user.userId,
    full_name: user.fullName,
    email: user.email,
    role: user.role,
    school_id: user.schoolId,
    profile_image: user.avatar,
    auth_user_id: user.userId, // Same as user_id for compatibility
  } : null;

  const role = user?.role;

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

  if (loading) {
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
