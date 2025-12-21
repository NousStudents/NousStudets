import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, GraduationCap } from 'lucide-react';
import { BackButton } from '@/components/BackButton';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface SubjectData {
  subject_id: string;
  subject_name: string;
  class_id: string | null;
  class_name: string | null;
  section: string | null;
}

export default function TeacherSubjects() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSubjects();
    }
  }, [user]);

  const fetchSubjects = async () => {
    try {
      // First get teacher_id
      const { data: teacherInfo } = await supabase
        .from('teachers')
        .select('teacher_id')
        .eq('auth_user_id', user?.id)
        .single();

      if (teacherInfo) {
        // Fetch subjects assigned to this teacher
        const { data: subjectsData, error } = await supabase
          .from('subjects')
          .select(`
            subject_id,
            subject_name,
            class_id,
            classes (
              class_id,
              class_name,
              section
            )
          `)
          .eq('teacher_id', teacherInfo.teacher_id);

        if (error) {
          console.error('Error fetching subjects:', error);
        } else {
          const formattedSubjects: SubjectData[] = (subjectsData || []).map(s => ({
            subject_id: s.subject_id,
            subject_name: s.subject_name,
            class_id: s.class_id,
            class_name: s.classes?.class_name || null,
            section: s.classes?.section || null,
          }));
          setSubjects(formattedSubjects);
        }
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          My Subjects
        </h2>
        <p className="text-muted-foreground">
          View all subjects assigned to you and their respective classes.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Assigned Subjects
            </CardTitle>
            <CardDescription>
              {subjects.length} subject{subjects.length !== 1 ? 's' : ''} assigned to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subjects.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Section</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject) => (
                    <TableRow key={subject.subject_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-primary/10 rounded">
                            <BookOpen className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium">{subject.subject_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {subject.class_name ? (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <GraduationCap className="h-3 w-3" />
                            {subject.class_name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">Not assigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {subject.section ? (
                          <Badge variant="secondary">{subject.section}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No subjects assigned yet</p>
                <p className="text-sm mt-1">Contact your administrator to get subjects assigned.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
