-- Create a SECURITY DEFINER function to get teacher's class IDs for RLS
CREATE OR REPLACE FUNCTION public.get_teacher_class_ids_for_students()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Get classes from timetable
  SELECT DISTINCT class_id FROM timetable WHERE teacher_id = get_teacher_id()
  UNION
  -- Get classes from subjects
  SELECT DISTINCT class_id FROM subjects WHERE teacher_id = get_teacher_id()
  UNION
  -- Get classes where teacher is class teacher
  SELECT DISTINCT class_id FROM classes WHERE class_teacher_id = get_teacher_id();
$$;

-- Add RLS policy for teachers to view students in their classes
CREATE POLICY "Teachers can view students in their classes"
ON public.students
FOR SELECT
USING (
  has_role('teacher') AND class_id IN (SELECT get_teacher_class_ids_for_students())
);

-- Add RLS policy for parents to view their children
CREATE POLICY "Parents can view their children"
ON public.students
FOR SELECT
USING (
  has_role('parent') AND parent_id = get_parent_id()
);