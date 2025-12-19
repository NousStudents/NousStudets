-- Add RLS policies for teachers to view subjects in their school
CREATE POLICY "Teachers can view subjects in their school"
ON public.subjects
FOR SELECT
USING (
  has_role('teacher') AND class_id IN (
    SELECT class_id FROM classes WHERE school_id = current_school_id()
  )
);

-- Add RLS policy for students to view subjects in their class
CREATE POLICY "Students can view subjects in their class"
ON public.subjects
FOR SELECT
USING (
  has_role('student') AND class_id = get_student_class_id()
);

-- Add RLS policy for students to view timetable for their class
CREATE POLICY "Students can view their class timetable"
ON public.timetable
FOR SELECT
USING (
  has_role('student') AND class_id = get_student_class_id()
);

-- Add RLS policy for teachers to view their timetable entries
CREATE POLICY "Teachers can view timetable in their school"
ON public.timetable
FOR SELECT
USING (
  has_role('teacher') AND class_id IN (
    SELECT class_id FROM classes WHERE school_id = current_school_id()
  )
);

-- Add RLS policy for teachers to view other teachers in their school (for dropdowns)
CREATE POLICY "Teachers can view colleagues in their school"
ON public.teachers
FOR SELECT
USING (
  has_role('teacher') AND school_id = current_school_id()
);

-- Add RLS policy for admins to view teachers (in case current one isn't working properly)
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
CREATE POLICY "Admins can manage teachers"
ON public.teachers
FOR ALL
USING (has_role('admin') AND school_id = current_school_id())
WITH CHECK (has_role('admin') AND school_id = current_school_id());

-- Add RLS policy for students/parents to view attendance
CREATE POLICY "Students can view their attendance"
ON public.attendance
FOR SELECT
USING (
  has_role('student') AND student_id = get_student_id()
);

CREATE POLICY "Parents can view children attendance"
ON public.attendance
FOR SELECT
USING (
  has_role('parent') AND student_id IN (
    SELECT student_id FROM students WHERE parent_id = get_parent_id()
  )
);

-- Teachers should be able to view attendance in their classes
CREATE POLICY "Teachers can view attendance in their classes"
ON public.attendance
FOR SELECT
USING (
  has_role('teacher') AND class_id IN (SELECT get_teacher_class_ids_for_students())
);

-- Admins should be able to manage attendance
CREATE POLICY "Admins can manage attendance"
ON public.attendance
FOR ALL
USING (has_role('admin') AND class_id IN (
  SELECT class_id FROM classes WHERE school_id = current_school_id()
))
WITH CHECK (has_role('admin') AND class_id IN (
  SELECT class_id FROM classes WHERE school_id = current_school_id()
));

-- Add RLS for exams - students can view their class exams
CREATE POLICY "Students can view their class exams"
ON public.exams
FOR SELECT
USING (
  has_role('student') AND class_id = get_student_class_id()
);

-- Teachers can view exams in their school
CREATE POLICY "Teachers can view exams in their school"
ON public.exams
FOR SELECT
USING (
  has_role('teacher') AND school_id = current_school_id()
);

-- Parents can view their children's exams
CREATE POLICY "Parents can view children exams"
ON public.exams
FOR SELECT
USING (
  has_role('parent') AND class_id IN (
    SELECT class_id FROM students WHERE parent_id = get_parent_id()
  )
);

-- Students can view exam timetable for their exams
CREATE POLICY "Students can view exam timetable"
ON public.exam_timetable
FOR SELECT
USING (
  has_role('student') AND exam_id IN (
    SELECT exam_id FROM exams WHERE class_id = get_student_class_id()
  )
);

-- Teachers can view exam timetable
CREATE POLICY "Teachers can view exam timetable"
ON public.exam_timetable
FOR SELECT
USING (
  has_role('teacher') AND exam_id IN (
    SELECT exam_id FROM exams WHERE school_id = current_school_id()
  )
);

-- Parents can view exam timetable
CREATE POLICY "Parents can view exam timetable"
ON public.exam_timetable
FOR SELECT
USING (
  has_role('parent') AND exam_id IN (
    SELECT exam_id FROM exams WHERE class_id IN (
      SELECT class_id FROM students WHERE parent_id = get_parent_id()
    )
  )
);

-- Admins can view all assignments in their school
CREATE POLICY "Admins can view all assignments"
ON public.assignments
FOR SELECT
USING (
  has_role('admin') AND class_id IN (
    SELECT class_id FROM classes WHERE school_id = current_school_id()
  )
);

-- Admins can create assignments
CREATE POLICY "Admins can create assignments"
ON public.assignments
FOR INSERT
WITH CHECK (
  has_role('admin') AND class_id IN (
    SELECT class_id FROM classes WHERE school_id = current_school_id()
  )
);

-- Admins can delete assignments
CREATE POLICY "Admins can delete assignments"
ON public.assignments
FOR DELETE
USING (
  has_role('admin') AND class_id IN (
    SELECT class_id FROM classes WHERE school_id = current_school_id()
  )
);