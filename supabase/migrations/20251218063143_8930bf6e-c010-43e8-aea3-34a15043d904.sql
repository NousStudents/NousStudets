-- Create a SECURITY DEFINER function to get classes for a teacher without RLS recursion
CREATE OR REPLACE FUNCTION public.get_teacher_class_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT c.class_id
  FROM classes c
  WHERE c.class_teacher_id = (SELECT teacher_id FROM teachers WHERE auth_user_id = auth.uid())
  UNION
  SELECT DISTINCT t.class_id
  FROM timetable t
  WHERE t.teacher_id = (SELECT teacher_id FROM teachers WHERE auth_user_id = auth.uid())
  UNION
  SELECT DISTINCT s.class_id
  FROM subjects s
  WHERE s.teacher_id = (SELECT teacher_id FROM teachers WHERE auth_user_id = auth.uid());
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Teachers can view classes they are assigned to" ON public.classes;

-- Create a new policy that uses the SECURITY DEFINER function
CREATE POLICY "Teachers can view their assigned classes"
ON public.classes
FOR SELECT
USING (
  has_role('teacher'::text) AND class_id IN (SELECT get_teacher_class_ids())
);