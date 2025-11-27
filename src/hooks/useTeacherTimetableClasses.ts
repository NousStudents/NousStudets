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
        // Fetch from timetable table
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

        // Also fetch from subjects table where teacher is directly assigned
        const { data: subjectsData } = await supabase
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
          .eq('teacher_id', teacherId);

        // Combine data from both sources
        const classesMap = new Map<string, TimetableClass>();
        const subjectsMap = new Map<string, TimetableSubject>();

        // Add classes and subjects from timetable
        if (timetableData) {
          timetableData.forEach(t => {
            if (t.classes) {
              classesMap.set(t.classes.class_id, t.classes as TimetableClass);
            }
            if (t.subjects) {
              subjectsMap.set(t.subjects.subject_id, t.subjects as TimetableSubject);
            }
          });
        }

        // Add classes and subjects from direct subject assignments
        if (subjectsData) {
          subjectsData.forEach(s => {
            if (s.classes) {
              classesMap.set(s.classes.class_id, s.classes as TimetableClass);
            }
            subjectsMap.set(s.subject_id, {
              subject_id: s.subject_id,
              subject_name: s.subject_name
            });
          });
        }

        const uniqueClasses = Array.from(classesMap.values());
        const uniqueSubjects = Array.from(subjectsMap.values());
        const classIds = uniqueClasses.map(c => c.class_id);
        const subjectIds = uniqueSubjects.map(s => s.subject_id);

        setData({
          classes: uniqueClasses,
          subjects: uniqueSubjects,
          classIds,
          subjectIds,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching teacher assignments:', error);
        setData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchTimetableAssignments();
  }, [teacherId]);

  return data;
}
