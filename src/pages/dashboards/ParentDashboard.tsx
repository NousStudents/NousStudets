import { useEffect, useState } from 'react';
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
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParentData();
  }, [profile]);

  const fetchParentData = async () => {
    try {
      // Fetch children data
      const { data: parentData } = await supabase
        .from('parents')
        .select('parent_id')
        .eq('user_id', profile.user_id)
        .single();

      if (parentData) {
        const { data: studentsData } = await supabase
          .from('students')
          .select('*, users!inner(*)')
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
            <Card key={child.student_id} className="bg-gradient-card border-primary/20">
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
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Attendance</span>
                  <Badge variant="secondary">95%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Grade</span>
                  <Badge variant="secondary">A-</Badge>
                </div>
                <Button variant="outline" className="w-full mt-3" size="sm">
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
        <TabsList className="hidden md:flex bg-card border border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="performance">Academic Performance</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        {/* Mobile Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border">
          <TabsList className="w-full h-auto grid grid-cols-5 gap-0 bg-transparent rounded-none p-0">
            <TabsTrigger 
              value="overview" 
              className="flex-col gap-1 h-16 rounded-none data-[state=active]:bg-primary/10"
            >
              <BookOpen className="h-5 w-5" />
              <span className="text-xs">Overview</span>
            </TabsTrigger>
            <TabsTrigger 
              value="attendance" 
              className="flex-col gap-1 h-16 rounded-none data-[state=active]:bg-primary/10"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-xs">Attendance</span>
            </TabsTrigger>
            <TabsTrigger 
              value="performance" 
              className="flex-col gap-1 h-16 rounded-none data-[state=active]:bg-primary/10"
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs">Performance</span>
            </TabsTrigger>
            <TabsTrigger 
              value="fees" 
              className="flex-col gap-1 h-16 rounded-none data-[state=active]:bg-primary/10"
            >
              <DollarSign className="h-5 w-5" />
              <span className="text-xs">Fees</span>
            </TabsTrigger>
            <TabsTrigger 
              value="communication" 
              className="flex-col gap-1 h-16 rounded-none data-[state=active]:bg-primary/10"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="text-xs">Messages</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Announcements */}
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

            {/* Upcoming Events */}
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
                  { title: 'Mathematics Exam', date: 'Nov 12, 2025', student: 'Priya' },
                  { title: 'Science Project Due', date: 'Nov 14, 2025', student: 'Priya' },
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

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-card border-success/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Overall Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">95%</div>
                <p className="text-xs text-muted-foreground mt-1">This month</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Average Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">A-</div>
                <p className="text-xs text-success mt-1">+5% improvement</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-warning/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Pending Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">3</div>
                <p className="text-xs text-muted-foreground mt-1">Due this week</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-destructive/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pending Fees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">₹0</div>
                <p className="text-xs text-success mt-1">All paid</p>
              </CardContent>
            </Card>
          </div>
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
