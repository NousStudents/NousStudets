-- Add policy to allow super admins to view all teachers
CREATE POLICY "Super admins can view all teachers"
ON public.teachers
FOR SELECT
USING (is_super_admin());