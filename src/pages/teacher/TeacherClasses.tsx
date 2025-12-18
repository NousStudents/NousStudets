import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Crown, BookOpen } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface ClassData {
  class_id: string;
  class_name: string;
  section: string | null;
  isClassTeacher?: boolean;
}

export default function TeacherClasses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classTeacherClasses, setClassTeacherClasses] = useState<ClassData[]>([]);
  const [subjectClasses, setSubjectClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchClasses();
    }
  }, [user]);

  const fetchClasses = async () => {
    try {
      const { data: teacherInfo } = await supabase
        .from('teachers')
        .select('teacher_id')
        .eq('auth_user_id', user?.id)
        .single();

      if (teacherInfo) {
        // Fetch classes where teacher is class teacher
        const { data: classTeacherData, error: ctError } = await supabase
          .from('classes')
          .select('class_id, class_name, section')
          .eq('class_teacher_id', teacherInfo.teacher_id);

        if (ctError) {
          console.error('Error fetching class teacher classes:', ctError);
        }
        
        const ctClasses = (classTeacherData || []).map(c => ({
          ...c,
          isClassTeacher: true
        }));
        setClassTeacherClasses(ctClasses);

        // Fetch from timetable and subjects for teaching assignments
        const [timetableData, subjectsData] = await Promise.all([
          supabase
            .from('timetable')
            .select(`
              class_id,
              classes (
                class_id,
                class_name,
                section
              )
            `)
            .eq('teacher_id', teacherInfo.teacher_id),
          supabase
            .from('subjects')
            .select(`
              class_id,
              classes (
                class_id,
                class_name,
                section
              )
            `)
            .eq('teacher_id', teacherInfo.teacher_id)
        ]);

        // Combine and deduplicate teaching classes (excluding class teacher classes)
        const classesMap = new Map<string, ClassData>();
        const ctClassIds = new Set(ctClasses.map(c => c.class_id));
        
        if (timetableData.data) {
          timetableData.data.forEach(t => {
            if (t.classes && !ctClassIds.has(t.classes.class_id)) {
              classesMap.set(t.classes.class_id, t.classes as ClassData);
            }
          });
        }

        if (subjectsData.data) {
          subjectsData.data.forEach(s => {
            if (s.classes && !ctClassIds.has(s.classes.class_id)) {
              classesMap.set(s.classes.class_id, s.classes as ClassData);
            }
          });
        }

        setSubjectClasses(Array.from(classesMap.values()));
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          My Classes
        </h2>
        <p className="text-muted-foreground">
          View all your assigned classes.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-6">
          {/* Class Teacher Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Class Teacher Assignments
              </CardTitle>
              <CardDescription>Classes where you are the class teacher</CardDescription>
            </CardHeader>
            <CardContent>
              {classTeacherClasses.length > 0 ? (
                <div className="space-y-4">
                  {classTeacherClasses.map((cls) => (
                    <div key={cls.class_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                          <Crown className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{cls.class_name}</h4>
                          <p className="text-sm text-muted-foreground">Section: {cls.section || 'A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                          Class Teacher
                        </Badge>
                        <Button variant="outline" onClick={() => navigate('/class-teacher')}>
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Crown className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>You are not assigned as class teacher for any class</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject Teaching Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Teaching Assignments
              </CardTitle>
              <CardDescription>Classes where you teach subjects</CardDescription>
            </CardHeader>
            <CardContent>
              {subjectClasses.length > 0 ? (
                <div className="space-y-4">
                  {subjectClasses.map((cls) => (
                    <div key={cls.class_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <BookOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{cls.class_name}</h4>
                          <p className="text-sm text-muted-foreground">Section: {cls.section || 'A'}</p>
                        </div>
                      </div>
                      <Button variant="outline">View Details</Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No subject teaching assignments yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
