-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Students can view their own class" ON public.classes;

-- Create a SECURITY DEFINER function to get student's class_id without RLS recursion
CREATE OR REPLACE FUNCTION public.get_student_class_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT class_id FROM students WHERE auth_user_id = auth.uid();
$$;

-- Recreate the policy using the function
CREATE POLICY "Students can view their own class"
ON public.classes
FOR SELECT
USING (
  has_role('student') AND class_id = get_student_class_id()
);