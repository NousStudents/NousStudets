-- Add RLS policy for students to view their own class
CREATE POLICY "Students can view their own class"
ON public.classes
FOR SELECT
USING (
  has_role('student') AND 
  class_id IN (
    SELECT students.class_id 
    FROM students 
    WHERE students.auth_user_id = auth.uid()
  )
);