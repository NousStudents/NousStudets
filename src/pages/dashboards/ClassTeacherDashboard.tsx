import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackButton } from '@/components/BackButton';
import { Users, ClipboardCheck, FileText, Bell, UserCheck } from 'lucide-react';
import { AttendanceSection } from '@/components/classTeacher/AttendanceSection';
import { LeaveRequestsSection } from '@/components/classTeacher/LeaveRequestsSection';
import { MarksEntrySection } from '@/components/classTeacher/MarksEntrySection';
import { StudentListSection } from '@/components/classTeacher/StudentListSection';
import { AnnouncementsSection } from '@/components/classTeacher/AnnouncementsSection';
import { toast } from 'sonner';

interface ClassInfo {
  class_id: string;
  class_name: string;
  section: string | null;
  student_count: number;
}

export default function ClassTeacherDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, [user]);

  const fetchClasses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get teacher_id
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('teacher_id')
        .eq('auth_user_id', user.id)
        .single();

      if (!teacherData) return;

      // Get classes where this teacher is class teacher
      const { data: classesData, error } = await supabase
        .from('classes')
        .select('class_id, class_name, section')
        .eq('class_teacher_id', teacherData.teacher_id);

      if (error) throw error;

      // Fetch student counts for each class separately to avoid RLS issues
      const formattedClasses = await Promise.all(
        (classesData || []).map(async (cls) => {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.class_id);
          
          return {
            class_id: cls.class_id,
            class_name: cls.class_name,
            section: cls.section,
            student_count: count || 0
          };
        })
      );

      setClasses(formattedClasses);
      
      if (formattedClasses.length > 0 && !selectedClass) {
        setSelectedClass(formattedClasses[0].class_id);
      }
    } catch (error: any) {
      toast.error('Failed to load classes');
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="flex items-center gap-4 mb-6">
          <BackButton />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Class Teacher Dashboard</h1>
            <p className="text-muted-foreground">Manage your assigned classes</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">You are not assigned as a class teacher to any class yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentClass = classes.find(c => c.class_id === selectedClass);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <BackButton />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Class Teacher Dashboard</h1>
          <p className="text-muted-foreground">Manage your class: {currentClass?.class_name} {currentClass?.section}</p>
        </div>
      </div>

      {/* Class Selection */}
      {classes.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Class</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {classes.map(cls => (
                <button
                  key={cls.class_id}
                  onClick={() => setSelectedClass(cls.class_id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedClass === cls.class_id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {cls.class_name} {cls.section} ({cls.student_count} students)
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-pastel-blue/30 border-pastel-blue/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentClass?.student_count || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      {selectedClass && (
        <Tabs defaultValue="attendance" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="leave" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Leave Requests</span>
            </TabsTrigger>
            <TabsTrigger value="marks" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Marks Entry</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Students</span>
            </TabsTrigger>
            <TabsTrigger value="announcements" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Announcements</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            <AttendanceSection classId={selectedClass} />
          </TabsContent>

          <TabsContent value="leave">
            <LeaveRequestsSection classId={selectedClass} />
          </TabsContent>

          <TabsContent value="marks">
            <MarksEntrySection classId={selectedClass} />
          </TabsContent>

          <TabsContent value="students">
            <StudentListSection classId={selectedClass} />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementsSection classId={selectedClass} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
