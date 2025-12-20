
-- Create a helper function to get teacher's school_id directly (avoids any recursion)
CREATE OR REPLACE FUNCTION public.get_teacher_school_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.teachers WHERE auth_user_id = auth.uid();
$$;

-- Fix current_school_id to avoid joining classes table for students
-- Instead, we'll need to store school_id directly on students or use a different approach
-- For now, let's update the subjects policy to use a simpler approach

-- Drop the problematic subjects policy for teachers and recreate with simpler logic
DROP POLICY IF EXISTS "Teachers can view subjects in their school" ON subjects;

-- Teachers can view subjects where:
-- 1. They are directly assigned as teacher_id
-- 2. OR the subject's class belongs to their school (using get_teacher_school_id)
CREATE POLICY "Teachers can view subjects in their school"
ON subjects
FOR SELECT
TO authenticated
USING (
  has_role('teacher') AND (
    teacher_id = get_teacher_id()
    OR class_id IN (
      SELECT class_id FROM classes WHERE school_id = get_teacher_school_id()
    )
  )
);

-- Also ensure classes policy is working correctly
-- The current policy should work, but let's verify by checking if teachers can see classes
