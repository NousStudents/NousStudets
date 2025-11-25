import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  FileText, 
  TrendingUp,
  Video,
  MessageSquare,
  Trophy,
  CreditCard
} from 'lucide-react';

interface StudentData {
  attendance_percentage: number;
  pending_assignments: number;
  upcoming_exams: number;
  average_grade: string;
  student_id?: string;
}

export default function StudentDashboard({ profile }: { profile: any }) {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState<StudentData>({
    attendance_percentage: 95,
    pending_assignments: 3,
    upcoming_exams: 2,
    average_grade: 'A-'
  });
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, [profile]);

  const fetchStudentData = async () => {
    try {
      const { data: studentInfo } = await supabase
        .from('students')
        .select('student_id')
        .eq('auth_user_id', profile.auth_user_id)
        .single();

      if (studentInfo) {
        setStudentData(prev => ({ ...prev, student_id: studentInfo.student_id }));
      }

      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('*')
        .order('due_date', { ascending: true })
        .limit(5);
      
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading student dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h2 className="text-4xl font-bold text-primary mb-3">
          Welcome back, {profile?.full_name?.split(' ')[0]}! 👋
        </h2>
        <p className="text-muted-foreground text-lg">
          Here's your academic overview for today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-pastel-green border-pastel-green/30 animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pastel-green-foreground flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-pastel-green-foreground">{studentData.attendance_percentage}%</div>
            <p className="text-xs text-pastel-green-foreground/80 mt-2 font-medium">+2% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-coral border-pastel-coral/30 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pastel-coral-foreground flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Pending Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-pastel-coral-foreground">{studentData.pending_assignments}</div>
            <p className="text-xs text-pastel-coral-foreground/80 mt-2">Due this week</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-purple border-pastel-purple/30 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pastel-purple-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-pastel-purple-foreground">{studentData.upcoming_exams}</div>
            <p className="text-xs text-pastel-purple-foreground/80 mt-2">Next 2 weeks</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-yellow border-pastel-yellow/30 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pastel-yellow-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Average Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-pastel-yellow-foreground">{studentData.average_grade}</div>
            <p className="text-xs text-pastel-yellow-foreground/80 mt-2 font-medium">+5% from last term</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="hidden md:flex gap-2 bg-card border border-border p-2 rounded-lg flex-wrap">
          <Button variant="secondary" size="sm" className="flex-1 min-w-[100px]">
            Overview
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[100px]" onClick={() => navigate('/student/academic')}>
            Academic
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[100px]" onClick={() => navigate('/student/financial')}>
            Financial
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[100px]" onClick={() => navigate('/timetable')}>
            Timetable
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[100px]" onClick={() => navigate('/assignments')}>
            Assignments
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[100px]" onClick={() => navigate('/exams')}>
            Exams
          </Button>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border">
          <div className="grid grid-cols-6 gap-0">
            <button className="flex flex-col items-center justify-center gap-1 h-16 bg-primary/10">
              <BookOpen className="h-5 w-5" />
              <span className="text-xs">Overview</span>
            </button>
            <button 
              className="flex flex-col items-center justify-center gap-1 h-16 hover:bg-accent"
              onClick={() => navigate('/timetable')}
            >
              <Calendar className="h-5 w-5" />
              <span className="text-xs">Timetable</span>
            </button>
            <button 
              className="flex flex-col items-center justify-center gap-1 h-16 hover:bg-accent"
              onClick={() => navigate('/assignments')}
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs">Assignments</span>
            </button>
            <button 
              className="flex flex-col items-center justify-center gap-1 h-16 hover:bg-accent"
              onClick={() => navigate('/exams')}
            >
              <Trophy className="h-5 w-5" />
              <span className="text-xs">Exams</span>
            </button>
            <button 
              className="flex flex-col items-center justify-center gap-1 h-16 hover:bg-accent"
              onClick={() => navigate('/attendance')}
            >
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-xs">Attendance</span>
            </button>
            <button 
              className="flex flex-col items-center justify-center gap-1 h-16 hover:bg-accent"
              onClick={() => navigate('/fees')}
            >
              <CreditCard className="h-5 w-5" />
              <span className="text-xs">Fees</span>
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6 pb-20 md:pb-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Today's Timetable
              </CardTitle>
              <CardDescription>Monday, November 9, 2025</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { time: '09:00 - 10:00', subject: 'Mathematics', teacher: 'Mr. Smith', room: 'Room 101' },
                { time: '10:15 - 11:15', subject: 'Physics', teacher: 'Dr. Johnson', room: 'Lab 2' },
                { time: '11:30 - 12:30', subject: 'English', teacher: 'Ms. Williams', room: 'Room 203' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="text-sm font-medium text-muted-foreground w-24">{item.time}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{item.subject}</h4>
                    <p className="text-sm text-muted-foreground">{item.teacher} • {item.room}</p>
                  </div>
                  <Badge variant="outline">Join</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-secondary" />
                Recent Assignments
              </CardTitle>
              <CardDescription>Due soon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <div key={assignment.assignment_id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{assignment.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1">{assignment.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="secondary">Submit</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No assignments yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Access common features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                <Video className="h-6 w-6" />
                <span className="text-sm">Online Classes</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                <MessageSquare className="h-6 w-6" />
                <span className="text-sm">AI Tutor</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4">
                <Trophy className="h-6 w-6" />
                <span className="text-sm">Quizzes</span>
              </Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate('/fees')}>
                <CreditCard className="h-6 w-6" />
                <span className="text-sm">Pay Fees</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
