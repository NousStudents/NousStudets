import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, User, TrendingUp, Calendar, Trophy, FileText, DollarSign, Receipt, AlertCircle } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { format } from 'date-fns';

interface FeeRecord {
  fee_id: string;
  amount: number;
  due_date: string | null;
  payment_date: string | null;
  status: string | null;
  students: {
    full_name: string;
  };
}

export default function ParentAcademic() {
  const { user } = useAuth();
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [feeStats, setFeeStats] = useState({
    totalDue: 0,
    totalPaid: 0,
    pending: 0
  });

  useEffect(() => {
    if (user) {
      fetchChildrenFees();
    }
  }, [user]);

  const fetchChildrenFees = async () => {
    try {
      const { data: parentData } = await supabase
        .from('parents')
        .select('parent_id')
        .eq('auth_user_id', user?.id)
        .single();

      if (!parentData) return;

      const { data: studentsData } = await supabase
        .from('students')
        .select('student_id')
        .eq('parent_id', parentData.parent_id);

      if (!studentsData || studentsData.length === 0) return;

      const studentIds = studentsData.map(s => s.student_id);

      const { data: feesData } = await supabase
        .from('fees')
        .select(`
          *,
          students (
            full_name
          )
        `)
        .in('student_id', studentIds)
        .order('created_at', { ascending: false });

      setFees(feesData || []);

      const totalDue = feesData?.reduce((sum, fee) => sum + fee.amount, 0) || 0;
      const totalPaid = feesData?.filter(f => f.status === 'paid').reduce((sum, fee) => sum + fee.amount, 0) || 0;
      const pending = feesData?.filter(f => f.status === 'pending').reduce((sum, fee) => sum + fee.amount, 0) || 0;

      setFeeStats({ totalDue, totalPaid, pending });
    } catch (error) {
      console.error('Error fetching fees:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Academic & Financial Overview</h1>
          <p className="text-muted-foreground">Monitor your children's progress and fees</p>
        </div>
      </div>

      {/* Children Selector */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {['Priya Kumar', 'Rahul Kumar'].map((child, i) => (
          <Button key={i} variant={i === 0 ? 'default' : 'outline'} className="whitespace-nowrap">
            <User className="h-4 w-4 mr-2" />
            {child}
          </Button>
        ))}
      </div>

      {/* Academic Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-pastel-blue/30 border-pastel-blue/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Overall Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">A-</div>
            <p className="text-xs text-success mt-1">+5% improvement</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-mint/30 border-pastel-mint/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Class Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">5th</div>
            <p className="text-xs text-muted-foreground">Out of 32</p>
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
            <div className="text-3xl font-bold">12/15</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card className="bg-pastel-yellow/30 border-pastel-yellow/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">95%</div>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Performance</CardTitle>
          <CardDescription>Grades across all subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { subject: 'Mathematics', grade: 'A', marks: '92/100', teacher: 'Mr. Sharma' },
              { subject: 'Physics', grade: 'A-', marks: '87/100', teacher: 'Dr. Gupta' },
              { subject: 'Chemistry', grade: 'B+', marks: '82/100', teacher: 'Ms. Patel' },
              { subject: 'English', grade: 'A', marks: '90/100', teacher: 'Ms. Singh' },
              { subject: 'Computer Science', grade: 'A+', marks: '95/100', teacher: 'Mr. Kumar' }
            ].map((subject, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{subject.subject}</h4>
                    <p className="text-sm text-muted-foreground">{subject.teacher}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="mb-1">{subject.grade}</Badge>
                  <p className="text-sm text-muted-foreground">{subject.marks}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Test Results
          </CardTitle>
          <CardDescription>Latest assessments and exams</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { test: 'Mid-term Mathematics', date: 'Nov 1, 2025', marks: '92/100', grade: 'A' },
              { test: 'Physics Unit Test', date: 'Oct 28, 2025', marks: '87/100', grade: 'A-' },
              { test: 'Chemistry Practical', date: 'Oct 25, 2025', marks: '82/100', grade: 'B+' }
            ].map((test, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-semibold">{test.test}</h4>
                  <p className="text-sm text-muted-foreground">{test.date}</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">{test.grade}</Badge>
                  <p className="text-sm text-muted-foreground mt-1">{test.marks}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Assessments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Assessments
          </CardTitle>
          <CardDescription>Tests and exams scheduled</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { subject: 'Mathematics Final', date: 'Nov 20, 2025', type: 'Exam', syllabus: 'Full syllabus' },
              { subject: 'Physics Unit 6', date: 'Nov 18, 2025', type: 'Test', syllabus: 'Thermodynamics' },
              { subject: 'English Literature', date: 'Nov 22, 2025', type: 'Exam', syllabus: 'Shakespeare' }
            ].map((exam, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-semibold">{exam.subject}</h4>
                  <p className="text-sm text-muted-foreground">{exam.date}</p>
                  <p className="text-xs text-muted-foreground mt-1">{exam.syllabus}</p>
                </div>
                <Badge variant="outline">{exam.type}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Academic Progress Trends
          </CardTitle>
          <CardDescription>Performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Progress charts and analytics coming soon</p>
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-pastel-blue/30 border-pastel-blue/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Total Due
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{feeStats.totalDue.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-pastel-mint/30 border-pastel-mint/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">₹{feeStats.totalPaid.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-pastel-yellow/30 border-pastel-yellow/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">₹{feeStats.pending.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Children's Fee Records
          </CardTitle>
          <CardDescription>Payment history and upcoming dues</CardDescription>
        </CardHeader>
        <CardContent>
          {fees.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-16 w-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">No fee records found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fees.map((fee) => (
                <div key={fee.fee_id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                  <div>
                    <h4 className="font-semibold">₹{fee.amount.toLocaleString()}</h4>
                    <p className="text-sm text-muted-foreground">{fee.students.full_name}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                      {fee.due_date && <span>Due: {format(new Date(fee.due_date), 'dd MMM yyyy')}</span>}
                      {fee.payment_date && <span>Paid: {format(new Date(fee.payment_date), 'dd MMM yyyy')}</span>}
                    </div>
                  </div>
                  <Badge variant={fee.status === 'paid' ? 'default' : 'secondary'}>
                    {fee.status || 'pending'}
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