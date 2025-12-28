import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  TrendingUp,
  Video,
  Trophy,
  CreditCard,
  Brain,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface StudentData {
  student_id?: string;
  class_id?: string;
}

export default function StudentDashboard({ profile }: { profile: any }) {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState<StudentData>({});
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, [profile]);

  const fetchStudentData = async () => {
    try {
      const { data: studentInfo } = await supabase
        .from('students')
        .select('student_id, class_id')
        .eq('auth_user_id', profile.auth_user_id)
        .single();

      if (studentInfo) {
        setStudentData(studentInfo);
        
        const { data: assignmentsData } = await supabase
          .from('assignments')
          .select('*')
          .eq('class_id', studentInfo.class_id)
          .order('due_date', { ascending: true })
          .limit(5);
        
        setAssignments(assignmentsData || []);
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 rounded-full border-t-2 border-primary animate-spin" />
      </div>
    );
  }

  const quickActions = [
    { icon: Calendar, label: 'Timetable', path: '/timetable', color: 'from-accent-purple to-accent-blue' },
    { icon: FileText, label: 'Assignments', path: '/assignments', color: 'from-accent-gold to-warning' },
    { icon: Trophy, label: 'Exams', path: '/exams', color: 'from-success to-accent-green' },
    { icon: CheckCircle2, label: 'Attendance', path: '/attendance', color: 'from-accent-blue to-accent-purple' },
    { icon: CreditCard, label: 'Fees', path: '/fees', color: 'from-warning to-accent-gold' },
    { icon: Brain, label: 'AI Assistant', path: '/student/ai-assistant', color: 'from-accent-purple to-destructive' },
  ];

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary via-card to-secondary p-6 md:p-8 animate-fade-up">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-accent-purple/10 to-accent-gold/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-accent-gold" />
            <span className="text-sm font-medium text-accent-gold">Welcome back</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">
            {profile?.full_name?.split(' ')[0]}
          </h2>
          <p className="text-muted-foreground text-lg">
            Here's your academic overview for today.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border/50 hover:shadow-lg transition-all duration-300 animate-fade-up stagger-1">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-accent-purple/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-accent-purple" />
              </div>
              <Badge variant="secondary" className="text-xs">{assignments.length}</Badge>
            </div>
            <p className="text-2xl font-bold text-foreground">{assignments.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Assignments</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 hover:shadow-lg transition-all duration-300 animate-fade-up stagger-2">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <p className="text-2xl font-bold text-foreground">92%</p>
            <p className="text-xs text-muted-foreground mt-1">Attendance</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 hover:shadow-lg transition-all duration-300 animate-fade-up stagger-3">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-accent-gold/10 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-accent-gold" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">A+</p>
            <p className="text-xs text-muted-foreground mt-1">Grade</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 hover:shadow-lg transition-all duration-300 animate-fade-up stagger-4">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-accent-blue" />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">5</p>
            <p className="text-xs text-muted-foreground mt-1">Classes Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div className="space-y-4 animate-fade-up">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="group flex flex-col items-center gap-3 p-4 rounded-2xl bg-card border border-border/50 hover:border-border hover:shadow-lg transition-all duration-300"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Assignments Section */}
      <Card className="border-border/50 animate-fade-up">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-semibold">Pending Assignments</CardTitle>
            <CardDescription>Due soon</CardDescription>
          </div>
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('/assignments')}>
            View all <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {assignments.length > 0 ? (
            assignments.slice(0, 3).map((assignment, index) => (
              <div 
                key={assignment.assignment_id} 
                className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors group"
              >
                <div className="h-10 w-10 rounded-xl bg-accent-purple/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-accent-purple" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">{assignment.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    Due: {new Date(assignment.due_date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  Submit
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <p className="font-medium text-foreground">All caught up!</p>
              <p className="text-sm text-muted-foreground mt-1">No pending assignments</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-pb">
        <div className="grid grid-cols-5 gap-0">
          {[
            { icon: BookOpen, label: 'Overview', path: '/student/overview' },
            { icon: Calendar, label: 'Schedule', path: '/timetable' },
            { icon: FileText, label: 'Tasks', path: '/assignments' },
            { icon: Trophy, label: 'Results', path: '/exams' },
            { icon: CreditCard, label: 'Fees', path: '/fees' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-1 py-3 hover:bg-secondary/50 transition-colors"
            >
              <item.icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
