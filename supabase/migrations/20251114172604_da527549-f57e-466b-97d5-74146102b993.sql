-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Admins can manage admins" ON public.admins;

-- Allow authenticated users to insert their own admin record if they don't have a role yet
CREATE POLICY "Allow initial admin creation" ON public.admins
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = auth_user_id 
  AND NOT EXISTS (
    SELECT 1 FROM public.admins WHERE auth_user_id = auth.uid()
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.teachers WHERE auth_user_id = auth.uid()
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.students WHERE auth_user_id = auth.uid()
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.parents WHERE auth_user_id = auth.uid()
  )
);

-- Allow admins to manage all admins in their school
CREATE POLICY "Admins can manage their school admins" ON public.admins
FOR ALL
TO authenticated
USING (
  has_role('admin'::text) AND school_id = current_school_id()
)
WITH CHECK (
  has_role('admin'::text) AND school_id = current_school_id()
);

-- Allow users to view their own admin record
CREATE POLICY "Users can view their own admin record" ON public.admins
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);