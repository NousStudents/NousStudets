import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { useAuth } from '@/contexts/AuthContext';

export default function TeacherClasses() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
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
        // Fetch from three sources: timetable, subjects, and class_teacher assignments
        const [timetableData, subjectsData, classTeacherData] = await Promise.all([
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
            .eq('teacher_id', teacherInfo.teacher_id),
          supabase
            .from('classes')
            .select('class_id, class_name, section')
            .eq('class_teacher_id', teacherInfo.teacher_id)
        ]);

        // Combine and deduplicate classes
        const classesMap = new Map();
        
        if (timetableData.data) {
          timetableData.data.forEach(t => {
            if (t.classes) {
              classesMap.set(t.classes.class_id, t.classes);
            }
          });
        }

        if (subjectsData.data) {
          subjectsData.data.forEach(s => {
            if (s.classes) {
              classesMap.set(s.classes.class_id, s.classes);
            }
          });
        }

        if (classTeacherData.data) {
          classTeacherData.data.forEach(c => {
            classesMap.set(c.class_id, c);
          });
        }

        const uniqueClasses = Array.from(classesMap.values());
        setClasses(uniqueClasses);
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
          Manage your assigned classes.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Classes</CardTitle>
          <CardDescription>Classes you teach this semester</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading...</div>
          ) : classes.length > 0 ? (
            <div className="space-y-4">
              {classes.map((cls: any) => (
                <div key={cls.class_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div>
                    <h4 className="font-semibold text-foreground">{cls.class_name}</h4>
                    <p className="text-sm text-muted-foreground">Section: {cls.section || 'A'}</p>
                  </div>
                  <Button variant="outline">View Details</Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No classes assigned yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
