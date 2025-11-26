import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  CheckCircle2,
  FileText,
  Bell
} from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { useAuth } from '@/contexts/AuthContext';

export default function ParentOverview() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchChildren();
    }
  }, [user]);

  const fetchChildren = async () => {
    try {
      const { data: parentData } = await supabase
        .from('parents')
        .select('parent_id')
        .eq('auth_user_id', user?.id)
        .single();

      if (parentData) {
        const { data: studentsData } = await supabase
          .from('students')
          .select('*')
          .eq('parent_id', parentData.parent_id);
        
        setChildren(studentsData || []);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Parent Overview
        </h2>
        <p className="text-muted-foreground">
          Monitor your children's academic progress and activities.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children.length > 0 ? (
          children.map((child) => (
            <Card key={child.student_id} className="bg-card border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{child.full_name}</CardTitle>
                    <CardDescription>Roll No: {child.roll_no || 'N/A'}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Attendance</span>
                  <Badge variant="secondary">95%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Grade</span>
                  <Badge variant="secondary">A-</Badge>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="text-center py-12 text-muted-foreground">
              <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No children profiles linked</p>
              <p className="text-sm">Contact administration to link student profiles</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Recent Announcements
            </CardTitle>
            <CardDescription>School updates and notices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: 'Parent-Teacher Meeting', date: 'Nov 15, 2025', type: 'Meeting' },
              { title: 'Annual Sports Day', date: 'Nov 20, 2025', type: 'Event' },
              { title: 'Winter Break Notice', date: 'Dec 18, 2025', type: 'Holiday' },
            ].map((item, i) => (
              <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                </div>
                <Badge variant="outline">{item.type}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-secondary" />
              Upcoming Events
            </CardTitle>
            <CardDescription>Important dates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { title: 'Mathematics Exam', date: 'Nov 12, 2025', student: 'All' },
              { title: 'Science Project Due', date: 'Nov 14, 2025', student: 'All' },
              { title: 'Parent Meeting', date: 'Nov 15, 2025', student: 'All' },
            ].map((item, i) => (
              <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                  <p className="text-xs text-muted-foreground mt-1">For: {item.student}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-pastel-green border-pastel-green/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pastel-green-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Overall Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pastel-green-foreground">95%</div>
            <p className="text-xs text-pastel-green-foreground/80 mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-blue border-pastel-blue/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pastel-blue-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Average Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pastel-blue-foreground">A-</div>
            <p className="text-xs text-pastel-blue-foreground/80 mt-1">+5% improvement</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-yellow border-pastel-yellow/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pastel-yellow-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Pending Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pastel-yellow-foreground">3</div>
            <p className="text-xs text-pastel-yellow-foreground/80 mt-1">Due this week</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-coral border-pastel-coral/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pastel-coral-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Pending Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-pastel-coral-foreground">₹0</div>
            <p className="text-xs text-pastel-coral-foreground/80 mt-1">All paid</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
