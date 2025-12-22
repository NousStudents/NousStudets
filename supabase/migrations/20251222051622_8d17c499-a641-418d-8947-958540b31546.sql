-- Create security definer function to get teacher's assignment IDs without triggering RLS
CREATE OR REPLACE FUNCTION public.get_teacher_assignment_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT assignment_id FROM assignments WHERE teacher_id = get_teacher_id();
$$;

-- Create security definer function to get student's assignment IDs from assignment_students
CREATE OR REPLACE FUNCTION public.get_student_assigned_assignment_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT assignment_id FROM assignment_students WHERE student_id = get_student_id();
$$;

-- Drop and recreate the problematic policies

-- Fix assignment_students policy (remove reference to assignments table)
DROP POLICY IF EXISTS "Teachers can manage assignment students" ON public.assignment_students;
CREATE POLICY "Teachers can manage assignment students" 
ON public.assignment_students 
FOR ALL 
USING (assignment_id IN (SELECT get_teacher_assignment_ids()))
WITH CHECK (assignment_id IN (SELECT get_teacher_assignment_ids()));

-- Fix assignments policy (remove reference to assignment_students table)
DROP POLICY IF EXISTS "Students can view their assignments" ON public.assignments;
CREATE POLICY "Students can view their assignments" 
ON public.assignments 
FOR SELECT 
USING (
  has_role('student') AND (
    class_id IN (SELECT class_id FROM students WHERE student_id = get_student_id())
    OR assignment_id IN (SELECT get_student_assigned_assignment_ids())
  )
);