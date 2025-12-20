
-- Fix the infinite recursion in classes RLS policies
-- The issue is that policies reference each other in a loop

-- Drop all existing policies on classes
DROP POLICY IF EXISTS "Admins can manage classes" ON classes;
DROP POLICY IF EXISTS "Parents can view children classes" ON classes;
DROP POLICY IF EXISTS "Students can view their own class" ON classes;
DROP POLICY IF EXISTS "Teachers can view classes in their school" ON classes;

-- Recreate policies using SECURITY DEFINER functions to avoid recursion

-- Admin policy - uses has_role which is already SECURITY DEFINER
CREATE POLICY "Admins can manage classes"
ON classes
FOR ALL
TO authenticated
USING (has_role('admin') AND school_id = current_school_id())
WITH CHECK (has_role('admin') AND school_id = current_school_id());

-- Student policy - uses get_student_class_id() which is SECURITY DEFINER
CREATE POLICY "Students can view their own class"
ON classes
FOR SELECT
TO authenticated
USING (has_role('student') AND class_id = get_student_class_id());

-- Teacher policy - need to avoid referencing classes table
-- Use current_school_id() which doesn't reference classes for teachers
CREATE POLICY "Teachers can view classes in their school"
ON classes
FOR SELECT
TO authenticated
USING (has_role('teacher') AND school_id = current_school_id());

-- Parent policy - use a simpler approach that doesn't cause recursion
-- Create a helper function first
CREATE OR REPLACE FUNCTION public.get_parent_children_class_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT class_id 
  FROM students 
  WHERE parent_id = get_parent_id() 
  AND class_id IS NOT NULL;
$$;

CREATE POLICY "Parents can view children classes"
ON classes
FOR SELECT
TO authenticated
USING (has_role('parent') AND class_id IN (SELECT get_parent_children_class_ids()));
