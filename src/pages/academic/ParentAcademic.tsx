import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  User,
  TrendingUp,
  Calendar,
  Trophy,
  FileText,
  DollarSign,
  Receipt,
  AlertCircle,
  GraduationCap,
  Clock,
  CheckCircle,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { format } from "date-fns";

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
    pending: 0,
  });

  useEffect(() => {
    if (user) {
      fetchChildrenFees();
    }
  }, [user]);

  const fetchChildrenFees = async () => {
    try {
      const { data: parentData } = await supabase
        .from("parents")
        .select("parent_id")
        .eq("auth_user_id", user?.id)
        .maybeSingle();

      if (!parentData) return;

      const { data: studentsData } = await supabase
        .from("students")
        .select("student_id")
        .eq("parent_id", parentData.parent_id);

      if (!studentsData || studentsData.length === 0) return;

      const studentIds = studentsData.map((s) => s.student_id);

      const { data: feesData } = await supabase
        .from("fees")
        .select(`
          *,
          students (
            full_name
          )
        `)
        .in("student_id", studentIds)
        .order("created_at", { ascending: false });

      setFees(feesData || []);

      const totalDue = feesData?.reduce((sum, fee) => sum + fee.amount, 0) || 0;
      const totalPaid =
        feesData?.filter((f) => f.status === "paid").reduce((sum, fee) => sum + fee.amount, 0) || 0;
      const pending =
        feesData?.filter((f) => f.status === "pending").reduce((sum, fee) => sum + fee.amount, 0) || 0;

      setFeeStats({ totalDue, totalPaid, pending });
    } catch (error) {
      console.error("Error fetching fees:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <header className="flex items-center gap-4">
          <BackButton />
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Academic & Financial</h1>
              <p className="text-sm text-muted-foreground">Monitor your children's progress</p>
            </div>
          </div>
        </header>

        {/* Children Selector */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          {["Priya Kumar", "Rahul Kumar"].map((child, i) => (
            <Button key={i} variant={i === 0 ? "default" : "outline"} className="whitespace-nowrap shrink-0">
              <User className="h-4 w-4 mr-2" />
              {child}
            </Button>
          ))}
        </div>

        {/* Academic Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Trophy className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">A-</p>
                  <p className="text-xs text-muted-foreground">Overall Grade</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">5th</p>
                  <p className="text-xs text-muted-foreground">Class Rank</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">12/15</p>
                  <p className="text-xs text-muted-foreground">Assignments</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">95%</p>
                  <p className="text-xs text-muted-foreground">Attendance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subject-wise Performance */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Subject Performance
            </CardTitle>
            <CardDescription>Grades across all subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {[
                { subject: "Mathematics", grade: "A", marks: "92/100", teacher: "Mr. Sharma" },
                { subject: "Physics", grade: "A-", marks: "87/100", teacher: "Dr. Gupta" },
                { subject: "Chemistry", grade: "B+", marks: "82/100", teacher: "Ms. Patel" },
                { subject: "English", grade: "A", marks: "90/100", teacher: "Ms. Singh" },
                { subject: "Computer Science", grade: "A+", marks: "95/100", teacher: "Mr. Kumar" },
              ].map((subject, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{subject.subject}</h4>
                      <p className="text-xs text-muted-foreground">{subject.teacher}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-1">
                      {subject.grade}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{subject.marks}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Test Results */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Recent Test Results
            </CardTitle>
            <CardDescription>Latest assessments and exams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { test: "Mid-term Mathematics", date: "Nov 1, 2025", marks: "92/100", grade: "A" },
                { test: "Physics Unit Test", date: "Oct 28, 2025", marks: "87/100", grade: "A-" },
                { test: "Chemistry Practical", date: "Oct 25, 2025", marks: "82/100", grade: "B+" },
              ].map((test, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                >
                  <div>
                    <h4 className="font-medium text-foreground">{test.test}</h4>
                    <p className="text-xs text-muted-foreground">{test.date}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">{test.grade}</Badge>
                    <p className="text-xs text-muted-foreground mt-1">{test.marks}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Assessments */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Assessments
            </CardTitle>
            <CardDescription>Tests and exams scheduled</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { subject: "Mathematics Final", date: "Nov 20, 2025", type: "Exam", syllabus: "Full syllabus" },
                { subject: "Physics Unit 6", date: "Nov 18, 2025", type: "Test", syllabus: "Thermodynamics" },
                { subject: "English Literature", date: "Nov 22, 2025", type: "Exam", syllabus: "Shakespeare" },
              ].map((exam, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                >
                  <div>
                    <h4 className="font-medium text-foreground">{exam.subject}</h4>
                    <p className="text-xs text-muted-foreground">{exam.date}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{exam.syllabus}</p>
                  </div>
                  <Badge variant="outline">{exam.type}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress Trends */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Academic Progress
            </CardTitle>
            <CardDescription>Performance over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground">Progress charts coming soon</p>
            </div>
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-blue-500/5">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Receipt className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">₹{feeStats.totalDue.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Due</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-green-500/5">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">₹{feeStats.totalPaid.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-amber-500/5">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">₹{feeStats.pending.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fee Records */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              Children's Fee Records
            </CardTitle>
            <CardDescription>Payment history and upcoming dues</CardDescription>
          </CardHeader>
          <CardContent>
            {fees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Receipt className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">No fee records found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fees.map((fee) => (
                  <div
                    key={fee.fee_id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          fee.status === "paid" ? "bg-green-500/10" : "bg-amber-500/10"
                        }`}
                      >
                        {fee.status === "paid" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">₹{fee.amount.toLocaleString()}</h4>
                        <p className="text-xs text-muted-foreground">{fee.students.full_name}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-0.5">
                          {fee.due_date && <span>Due: {format(new Date(fee.due_date), "dd MMM yyyy")}</span>}
                          {fee.payment_date && (
                            <span>Paid: {format(new Date(fee.payment_date), "dd MMM yyyy")}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant={fee.status === "paid" ? "default" : "secondary"}>
                      {fee.status || "pending"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
