import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Users,
  FileText,
  Calendar,
  TrendingUp,
  ClipboardList,
  DollarSign,
  CreditCard,
  GraduationCap,
  ArrowRight,
  CheckCircle,
  Clock,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { format } from "date-fns";

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
    lastPayment: 0,
  });

  useEffect(() => {
    if (user) {
      fetchPayroll();
    }
  }, [user]);

  const fetchPayroll = async () => {
    try {
      const { data: teacherData } = await supabase
        .from("teachers")
        .select("teacher_id")
        .eq("auth_user_id", user?.id)
        .maybeSingle();

      if (!teacherData) return;

      const { data: payrollData } = await supabase
        .from("payroll")
        .select("*")
        .eq("teacher_id", teacherData.teacher_id)
        .order("month", { ascending: false })
        .limit(6);

      setPayroll(payrollData || []);

      const totalEarned =
        payrollData?.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amount, 0) || 0;
      const pending =
        payrollData?.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0) || 0;
      const lastPayment = payrollData?.find((p) => p.status === "paid")?.amount || 0;

      setSalaryStats({ totalEarned, pending, lastPayment });
    } catch (error) {
      console.error("Error fetching payroll:", error);
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
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Academic & Payroll</h1>
              <p className="text-sm text-muted-foreground">Manage classes and view salary</p>
            </div>
          </div>
        </header>

        {/* Academic Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">5</p>
                  <p className="text-xs text-muted-foreground">Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">2</p>
                  <p className="text-xs text-muted-foreground">Subjects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">24</p>
                  <p className="text-xs text-muted-foreground">12 to review</p>
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
                  <p className="text-2xl font-bold text-foreground">87%</p>
                  <p className="text-xs text-muted-foreground">Avg Performance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Classes Overview */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              My Classes
            </CardTitle>
            <CardDescription>Classes you're currently teaching</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {[
                { name: "Grade 9A - Mathematics", students: 32, room: "101" },
                { name: "Grade 10B - Mathematics", students: 30, room: "102" },
                { name: "Grade 11A - Physics", students: 28, room: "201" },
                { name: "Grade 12A - Physics", students: 25, room: "202" },
              ].map((cls, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{cls.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {cls.students} students • Room {cls.room}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    View
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Curriculum Progress */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Curriculum Progress
            </CardTitle>
            <CardDescription>Track syllabus completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {[
                { subject: "Mathematics - Grade 9", progress: 75, unit: "Unit 5: Trigonometry" },
                { subject: "Mathematics - Grade 10", progress: 60, unit: "Unit 4: Statistics" },
                { subject: "Physics - Grade 11", progress: 80, unit: "Unit 6: Thermodynamics" },
                { subject: "Physics - Grade 12", progress: 55, unit: "Unit 3: Electromagnetism" },
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground text-sm">{item.subject}</h4>
                    <span className="text-sm font-semibold text-primary">{item.progress}%</span>
                  </div>
                  <Progress value={item.progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">Current: {item.unit}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pending Grading */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Pending Grading
            </CardTitle>
            <CardDescription>Assignments awaiting review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: "Calculus Assignment 5", cls: "Grade 10B", submissions: 28, total: 32 },
                { title: "Physics Lab Report", cls: "Grade 11A", submissions: 30, total: 30 },
                { title: "Algebra Quiz 3", cls: "Grade 9A", submissions: 25, total: 28 },
              ].map((assignment, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                >
                  <div>
                    <h4 className="font-medium text-foreground">{assignment.title}</h4>
                    <p className="text-xs text-muted-foreground">{assignment.cls}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {assignment.submissions}/{assignment.total} submissions
                      </span>
                    </div>
                  </div>
                  <Button size="sm">Grade Now</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lesson Planning */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Lesson Planning
            </CardTitle>
            <CardDescription>Upcoming lessons and materials</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-muted-foreground">Lesson planner coming soon</p>
            </div>
          </CardContent>
        </Card>

        {/* Salary Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-green-500/5">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <DollarSign className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">₹{salaryStats.totalEarned.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Earned</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-amber-500/5">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">₹{salaryStats.pending.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-blue-500/5">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <CreditCard className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">₹{salaryStats.lastPayment.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Last Payment</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payroll History */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Salary History
            </CardTitle>
            <CardDescription>Recent payment records</CardDescription>
          </CardHeader>
          <CardContent>
            {payroll.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <CreditCard className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">No payroll records found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {payroll.map((record) => (
                  <div
                    key={record.payroll_id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          record.status === "paid" ? "bg-green-500/10" : "bg-amber-500/10"
                        }`}
                      >
                        {record.status === "paid" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Clock className="h-5 w-5 text-amber-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">₹{record.amount.toLocaleString()}</h4>
                        <p className="text-xs text-muted-foreground">{record.month}</p>
                        {record.payment_date && (
                          <p className="text-xs text-muted-foreground">
                            Paid: {format(new Date(record.payment_date), "dd MMM yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={record.status === "paid" ? "default" : "secondary"}
                      className={record.status === "paid" ? "bg-green-500" : ""}
                    >
                      {record.status === "paid" ? "Credited" : "Pending"}
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
