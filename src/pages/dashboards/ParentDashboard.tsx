import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  CheckCircle2,
  FileText,
  MessageSquare,
  Bell,
  BookOpen
} from 'lucide-react';

export default function ParentDashboard({ profile }: { profile: any }) {
  const navigate = useNavigate();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParentData();
  }, [profile]);

  const fetchParentData = async () => {
    try {
      // Get parent_id directly
      const { data: parentData } = await supabase
        .from('parents')
        .select('parent_id')
        .eq('auth_user_id', profile.auth_user_id)
        .single();

      if (parentData) {
        const { data: studentsData } = await supabase
          .from('students')
          .select('*')
          .eq('parent_id', parentData.parent_id);
        
        setChildren(studentsData || []);
      }
    } catch (error) {
      console.error('Error fetching parent data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading parent dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Welcome, {profile?.full_name?.split(' ')[0]}!
        </h2>
        <p className="text-muted-foreground">
          Monitor your children's academic progress and school activities.
        </p>
      </div>

      {/* Children Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children.length > 0 ? (
          children.map((child, index) => (
            <Card key={child.student_id} className="bg-card border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{child.users.full_name}</CardTitle>
                    <CardDescription>Grade {child.class_id ? '10' : 'N/A'} • Roll No: {child.roll_no || 'N/A'}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full mt-3" size="sm" onClick={() => navigate('/parent/academic')}>
                  View Details
                </Button>
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6 pb-20 md:pb-6">
        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-2 bg-card border border-border p-2 rounded-lg flex-wrap">
          <Button variant="secondary" size="sm" className="flex-1 min-w-[120px]" onClick={() => navigate('/parent/overview')}>
            Overview
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[120px]" onClick={() => navigate('/parent/academic')}>
            Academic
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[120px]" onClick={() => navigate('/attendance')}>
            Attendance
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[120px]" onClick={() => navigate('/fees')}>
            Fees
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 min-w-[120px]" onClick={() => navigate('/messages')}>
            Messages
          </Button>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border">
          <div className="w-full h-auto grid grid-cols-5 gap-0">
            <button 
              className="flex-col gap-1.5 h-16 flex items-center justify-center hover:bg-accent transition-colors"
              onClick={() => navigate('/parent/overview')}
            >
              <BookOpen className="h-5 w-5" />
              <span className="text-[10px] font-medium">Overview</span>
            </button>
            <button 
              className="flex-col gap-1.5 h-16 flex items-center justify-center hover:bg-accent transition-colors"
              onClick={() => navigate('/parent/academic')}
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] font-medium">Academic</span>
            </button>
            <button 
              className="flex-col gap-1.5 h-16 flex items-center justify-center hover:bg-accent transition-colors"
              onClick={() => navigate('/attendance')}
            >
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-[10px] font-medium">Attendance</span>
            </button>
            <button 
              className="flex-col gap-1.5 h-16 flex items-center justify-center hover:bg-accent transition-colors"
              onClick={() => navigate('/fees')}
            >
              <DollarSign className="h-5 w-5" />
              <span className="text-[10px] font-medium">Fees</span>
            </button>
            <button 
              className="flex-col gap-1.5 h-16 flex items-center justify-center hover:bg-accent transition-colors"
              onClick={() => navigate('/messages')}
            >
              <MessageSquare className="h-5 w-5" />
              <span className="text-[10px] font-medium">Messages</span>
            </button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Children Overview</CardTitle>
              <CardDescription>View your children's details in Academic section</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground mb-4">Track your children's academic progress</p>
                <Button onClick={() => navigate('/parent/academic')}>
                  View Academic Details
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>Track your children's attendance records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Detailed attendance records coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Academic Performance</CardTitle>
              <CardDescription>View grades and progress reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Performance reports coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle>Fee Management</CardTitle>
              <CardDescription>View and pay school fees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Fee payment system coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Communication</CardTitle>
              <CardDescription>Message teachers and view responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Messaging system coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
