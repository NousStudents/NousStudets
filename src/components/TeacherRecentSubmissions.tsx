import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText } from 'lucide-react';
import { useTeacherTimetableClasses } from '@/hooks/useTeacherTimetableClasses';

interface Submission {
  submission_id: string;
  submitted_at: string;
  students: {
    full_name: string;
  };
  assignments: {
    title: string;
    subjects: {
      subject_name: string;
    };
  };
}

export default function TeacherRecentSubmissions({ teacherId }: { teacherId: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const { classIds, subjectIds } = useTeacherTimetableClasses(teacherId);

  useEffect(() => {
    if (classIds.length > 0 && subjectIds.length > 0) {
      fetchSubmissions();
    } else {
      setLoading(false);
    }
  }, [classIds, subjectIds]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          submission_id,
          submitted_at,
          marks_obtained,
          students (full_name),
          assignments (
            title,
            class_id,
            subject_id,
            subjects (subject_name)
          )
        `)
        .is('marks_obtained', null)
        .order('submitted_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Submissions query error:', error);
        setSubmissions([]);
        return;
      }

      // Filter client-side to only include submissions for teacher's classes/subjects
      const filtered = (data || []).filter(sub => {
        const assignment = sub.assignments;
        if (!assignment) return false;
        return classIds.includes(assignment.class_id) && subjectIds.includes(assignment.subject_id);
      }).slice(0, 5);

      setSubmissions(filtered);
    } catch (error) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const submittedDate = new Date(dateString);
    const diffMs = now.getTime() - submittedDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-secondary" />
            Recent Submissions
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-secondary" />
          Recent Submissions
        </CardTitle>
        <CardDescription>Pending review from your timetable classes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No pending submissions</p>
          </div>
        ) : (
          submissions.map((submission) => (
            <div
              key={submission.submission_id}
              className="flex items-start justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">
                  {submission.students?.full_name}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {submission.assignments?.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {submission.assignments?.subjects?.subject_name} • {getTimeAgo(submission.submitted_at)}
                </p>
              </div>
              <Badge variant="secondary">Grade</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
