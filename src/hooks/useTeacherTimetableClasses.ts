import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TimetableClass {
  class_id: string;
  class_name: string;
  section: string | null;
}

interface TimetableSubject {
  subject_id: string;
  subject_name: string;
}

interface TeacherTimetableData {
  classes: TimetableClass[];
  subjects: TimetableSubject[];
  classIds: string[];
  subjectIds: string[];
  loading: boolean;
}

/**
 * Hook to get a teacher's current classes and subjects based on timetable assignments
 * This ensures teachers only see data for classes/subjects they're currently assigned to
 */
export function useTeacherTimetableClasses(teacherId: string | null): TeacherTimetableData {
  const [data, setData] = useState<TeacherTimetableData>({
    classes: [],
    subjects: [],
    classIds: [],
    subjectIds: [],
    loading: true,
  });

  useEffect(() => {
    if (!teacherId) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchTimetableAssignments = async () => {
      try {
        const { data: timetableData } = await supabase
          .from('timetable')
          .select(`
            class_id,
            subject_id,
            classes (
              class_id,
              class_name,
              section
            ),
            subjects (
              subject_id,
              subject_name
            )
          `)
          .eq('teacher_id', teacherId);

        if (timetableData) {
          // Get unique classes
          const uniqueClasses = Array.from(
            new Map(
              timetableData
                .filter(t => t.classes)
                .map(t => [t.classes.class_id, t.classes])
            ).values()
          ) as TimetableClass[];

          // Get unique subjects
          const uniqueSubjects = Array.from(
            new Map(
              timetableData
                .filter(t => t.subjects)
                .map(t => [t.subjects.subject_id, t.subjects])
            ).values()
          ) as TimetableSubject[];

          const classIds = uniqueClasses.map(c => c.class_id);
          const subjectIds = uniqueSubjects.map(s => s.subject_id);

          setData({
            classes: uniqueClasses,
            subjects: uniqueSubjects,
            classIds,
            subjectIds,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Error fetching teacher timetable assignments:', error);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchTimetableAssignments();
  }, [teacherId]);

  return data;
}
