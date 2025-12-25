import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
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
  GraduationCap,
  ArrowRight,
  School,
  ClipboardList,
  BarChart3,
  Clock,
  CheckCircle,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useNavigate } from "react-router-dom";

interface ClassData {
  class_id: string;
  class_name: string;
  section: string | null;
  student_count: number;
}

interface SubjectData {
  subject_id: string;
  subject_name: string;
  class_name: string;
  teacher_name: string | null;
}

interface ExamData {
  exam_id: string;
  exam_name: string;
  class_name: string;
  start_date: string | null;
  end_date: string | null;
}

export default function AdminAcademic() {
  const { schoolId } = useTenant();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [exams, setExams] = useState<ExamData[]>([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    upcomingExams: 0,
    activeAssignments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (schoolId) {
      fetchAcademicData();
    } else {
      // If no schoolId, stop loading after a short delay to allow context to load
      const timer = setTimeout(() => {
        setLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [schoolId]);

  const fetchAcademicData = async () => {
    try {
      setLoading(true);

      // Fetch classes with student count
      const { data: classesData } = await supabase
        .from("classes")
        .select(`
          class_id,
          class_name,
          section,
          students:students(count)
        `)
        .eq("school_id", schoolId);

      const formattedClasses = classesData?.map((cls: any) => ({
        class_id: cls.class_id,
        class_name: cls.class_name,
        section: cls.section,
        student_count: cls.students?.[0]?.count || 0,
      })) || [];

      setClasses(formattedClasses);

      // Fetch subjects with class and teacher info
      const { data: subjectsData } = await supabase
        .from("subjects")
        .select(`
          subject_id,
          subject_name,
          classes:class_id(class_name),
          teachers:teacher_id(full_name)
        `)
        .limit(10);

      const formattedSubjects = subjectsData?.map((sub: any) => ({
        subject_id: sub.subject_id,
        subject_name: sub.subject_name,
        class_name: sub.classes?.class_name || "N/A",
        teacher_name: sub.teachers?.full_name || "Unassigned",
      })) || [];

      setSubjects(formattedSubjects);

      // Fetch recent/upcoming exams
      const { data: examsData } = await supabase
        .from("exams")
        .select(`
          exam_id,
          exam_name,
          start_date,
          end_date,
          classes:class_id(class_name)
        `)
        .eq("school_id", schoolId)
        .order("start_date", { ascending: false })
        .limit(5);

      const formattedExams = examsData?.map((exam: any) => ({
        exam_id: exam.exam_id,
        exam_name: exam.exam_name,
        class_name: exam.classes?.class_name || "N/A",
        start_date: exam.start_date,
        end_date: exam.end_date,
      })) || [];

      setExams(formattedExams);

      // Fetch statistics
      const { count: teacherCount } = await supabase
        .from("teachers")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId);

      const { count: studentCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      const { count: assignmentCount } = await supabase
        .from("assignments")
        .select("*", { count: "exact", head: true });

      const today = new Date().toISOString().split("T")[0];
      const { count: upcomingExamCount } = await supabase
        .from("exams")
        .select("*", { count: "exact", head: true })
        .eq("school_id", schoolId)
        .gte("start_date", today);

      setStats({
        totalClasses: formattedClasses.length,
        totalStudents: studentCount || 0,
        totalTeachers: teacherCount || 0,
        totalSubjects: formattedSubjects.length,
        upcomingExams: upcomingExamCount || 0,
        activeAssignments: assignmentCount || 0,
      });
    } catch (error) {
      console.error("Error fetching academic data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading academic data...</p>
        </div>
      </div>
    );
  }

  if (!schoolId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <School className="h-8 w-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">School Not Found</h2>
          <p className="text-muted-foreground">Unable to load academic data. Please try again.</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

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
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Academic Overview</h1>
              <p className="text-sm text-muted-foreground">Manage classes, subjects, and exams</p>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <School className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalClasses}</p>
                  <p className="text-xs text-muted-foreground">Total Classes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalStudents}</p>
                  <p className="text-xs text-muted-foreground">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalTeachers}</p>
                  <p className="text-xs text-muted-foreground">Total Teachers</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.totalSubjects}</p>
                  <p className="text-xs text-muted-foreground">Total Subjects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.upcomingExams}</p>
                  <p className="text-xs text-muted-foreground">Upcoming Exams</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats.activeAssignments}</p>
                  <p className="text-xs text-muted-foreground">Assignments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Manage academic resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate("/admin/classes")}
              >
                <School className="h-5 w-5" />
                <span className="text-xs">Manage Classes</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate("/admin/timetable")}
              >
                <Calendar className="h-5 w-5" />
                <span className="text-xs">Timetable</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate("/admin/exam-timetable")}
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs">Exam Schedule</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col gap-2"
                onClick={() => navigate("/admin/reports")}
              >
                <BarChart3 className="h-5 w-5" />
                <span className="text-xs">Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Classes Overview */}
        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <School className="h-5 w-5 text-primary" />
                Classes Overview
              </CardTitle>
              <CardDescription>All classes in your school</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/classes")}>
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <School className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">No classes found</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate("/admin/classes")}
                >
                  Add Classes
                </Button>
              </div>
            ) : (
              <div className="grid gap-3">
                {classes.slice(0, 5).map((cls) => (
                  <div
                    key={cls.class_id}
                    className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <School className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">
                          {cls.class_name} {cls.section ? `- ${cls.section}` : ""}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {cls.student_count} students
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subjects Overview */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Subjects Overview
            </CardTitle>
            <CardDescription>Subjects and assigned teachers</CardDescription>
          </CardHeader>
          <CardContent>
            {subjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">No subjects found</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {subjects.map((subject) => (
                  <div
                    key={subject.subject_id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{subject.subject_name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {subject.class_name} • {subject.teacher_name}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{subject.class_name}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Exams */}
        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Recent Exams
              </CardTitle>
              <CardDescription>Exam schedules and results</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/exam-timetable")}>
              Manage Exams
            </Button>
          </CardHeader>
          <CardContent>
            {exams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground">No exams scheduled</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate("/admin/exam-timetable")}
                >
                  Schedule Exams
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {exams.map((exam) => {
                  const isUpcoming = exam.start_date && new Date(exam.start_date) > new Date();
                  return (
                    <div
                      key={exam.exam_id}
                      className="flex items-center justify-between p-4 bg-muted/30 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                          isUpcoming ? "bg-blue-500/10" : "bg-green-500/10"
                        }`}>
                          {isUpcoming ? (
                            <Clock className="h-5 w-5 text-blue-500" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground">{exam.exam_name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {exam.class_name} • {exam.start_date || "Date TBD"}
                          </p>
                        </div>
                      </div>
                      <Badge variant={isUpcoming ? "default" : "secondary"}>
                        {isUpcoming ? "Upcoming" : "Completed"}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Analytics */}
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Performance Analytics
            </CardTitle>
            <CardDescription>School-wide academic performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground text-sm">Overall Pass Rate</h4>
                  <span className="text-sm font-semibold text-primary">85%</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground text-sm">Assignment Completion</h4>
                  <span className="text-sm font-semibold text-primary">78%</span>
                </div>
                <Progress value={78} className="h-2" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-foreground text-sm">Average Attendance</h4>
                  <span className="text-sm font-semibold text-primary">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
