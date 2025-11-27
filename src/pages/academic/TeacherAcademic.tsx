import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users, FileText, Calendar, TrendingUp, ClipboardList, DollarSign, CreditCard } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { format } from 'date-fns';

interface PayrollRecord {
  payroll_id: string;
  amount: number;
  month: string;
  status: string | null;
  payment_date: string | null;
}

export default function TeacherAcademic() {
  const { user } = useAuth();
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [salaryStats, setSalaryStats] = useState({
    totalEarned: 0,
    pending: 0,
    lastPayment: 0
  });

  useEffect(() => {
    if (user) {
      fetchPayroll();
    }
  }, [user]);

  const fetchPayroll = async () => {
    try {
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('teacher_id')
        .eq('auth_user_id', user?.id)
        .single();

      if (!teacherData) return;

      const { data: payrollData } = await supabase
        .from('payroll')
        .select('*')
        .eq('teacher_id', teacherData.teacher_id)
        .order('month', { ascending: false })
        .limit(6);

      setPayroll(payrollData || []);

      const totalEarned = payrollData?.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) || 0;
      const pending = payrollData?.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0) || 0;
      const lastPayment = payrollData?.find(p => p.status === 'paid')?.amount || 0;

      setSalaryStats({ totalEarned, pending, lastPayment });
    } catch (error) {
      console.error('Error fetching payroll:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Academic & Payroll Portal</h1>
          <p className="text-muted-foreground">Manage your classes and view salary information</p>
        </div>
      </div>

      {/* Academic Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-pastel-blue/30 border-pastel-blue/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Classes Teaching
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">5</div>
          </CardContent>
        </Card>

        <Card className="bg-pastel-mint/30 border-pastel-mint/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Math & Physics</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-peach/30 border-pastel-peach/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">12 pending review</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-yellow/30 border-pastel-yellow/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">87%</div>
          </CardContent>
        </Card>
      </div>

      {/* Classes Overview */}
      <Card>
        <CardHeader>
          <CardTitle>My Classes</CardTitle>
          <CardDescription>Classes you're currently teaching</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {['Grade 9A - Mathematics', 'Grade 10B - Mathematics', 'Grade 11A - Physics', 'Grade 12A - Physics'].map((className, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{className}</h4>
                    <p className="text-sm text-muted-foreground">32 students • Room 101</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">View Details</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Curriculum Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Curriculum Progress
          </CardTitle>
          <CardDescription>Track completion of syllabus</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { subject: 'Mathematics - Grade 9', progress: 75, unit: 'Unit 5: Trigonometry' },
              { subject: 'Mathematics - Grade 10', progress: 60, unit: 'Unit 4: Statistics' },
              { subject: 'Physics - Grade 11', progress: 80, unit: 'Unit 6: Thermodynamics' },
              { subject: 'Physics - Grade 12', progress: 55, unit: 'Unit 3: Electromagnetism' }
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{item.subject}</h4>
                  <span className="text-sm font-medium">{item.progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${item.progress}%` }} />
                </div>
                <p className="text-sm text-muted-foreground">Current: {item.unit}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Grading */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pending Grading
          </CardTitle>
          <CardDescription>Assignments awaiting review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { title: 'Calculus Assignment 5', class: 'Grade 10B', submissions: 28, total: 32 },
              { title: 'Physics Lab Report', class: 'Grade 11A', submissions: 30, total: 30 },
              { title: 'Algebra Quiz 3', class: 'Grade 9A', submissions: 25, total: 28 }
            ].map((assignment, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-semibold">{assignment.title}</h4>
                  <p className="text-sm text-muted-foreground">{assignment.class}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {assignment.submissions}/{assignment.total} submissions
                  </p>
                </div>
                <Button size="sm">Grade Now</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lesson Planning */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Lesson Planning
          </CardTitle>
          <CardDescription>Upcoming lessons and materials</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Lesson planner coming soon</p>
          </div>
        </CardContent>
      </Card>

      {/* Salary Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-pastel-mint/30 border-pastel-mint/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">₹{salaryStats.totalEarned.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">This academic year</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-yellow/30 border-pastel-yellow/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{salaryStats.pending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-blue/30 border-pastel-blue/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Last Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{salaryStats.lastPayment.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Most recent</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Salary History
          </CardTitle>
          <CardDescription>Recent payment records</CardDescription>
        </CardHeader>
        <CardContent>
          {payroll.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">No payroll records found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {payroll.map((record) => (
                <div key={record.payroll_id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <h4 className="font-semibold">₹{record.amount.toLocaleString()}</h4>
                    <p className="text-sm text-muted-foreground">{record.month}</p>
                    {record.payment_date && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Paid: {format(new Date(record.payment_date), 'dd MMM yyyy')}
                      </p>
                    )}
                  </div>
                  <Badge variant={record.status === 'paid' ? 'default' : 'secondary'} className={record.status === 'paid' ? 'bg-success' : ''}>
                    {record.status === 'paid' ? 'Credited' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}