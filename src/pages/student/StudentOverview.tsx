import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  BookOpen,
  FileText,
  Video,
  MessageSquare,
  Trophy,
  CreditCard
} from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      const { data } = await supabase
        .from('assignments')
        .select('*')
        .order('due_date', { ascending: true })
        .limit(5);
      
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Student Overview
        </h2>
        <p className="text-muted-foreground">
          Your daily academic snapshot and quick actions.
        </p>
      </div>

      <div className="space-y-6">
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
              {!loading && assignments.length > 0 ? (
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
              <Button variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => navigate('/meetings')}>
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
