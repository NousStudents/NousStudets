
-- Drop the restrictive policy and create a new one that allows teachers to view all classes in their school
DROP POLICY IF EXISTS "Teachers can view their assigned classes" ON classes;

CREATE POLICY "Teachers can view classes in their school"
ON classes
FOR SELECT
TO authenticated
USING (
  has_role('teacher') AND school_id = current_school_id()
);

-- Also ensure parents can view their children's classes
DROP POLICY IF EXISTS "Parents can view children classes" ON classes;

CREATE POLICY "Parents can view children classes"
ON classes
FOR SELECT
TO authenticated
USING (
  has_role('parent') AND class_id IN (
    SELECT class_id FROM students WHERE parent_id = get_parent_id()
  )
);
