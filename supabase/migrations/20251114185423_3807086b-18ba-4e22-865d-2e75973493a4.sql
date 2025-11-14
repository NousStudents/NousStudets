-- Clean up all super_admins policies and create minimal, non-conflicting set
DROP POLICY IF EXISTS "Users can view their own super admin record" ON public.super_admins;
DROP POLICY IF EXISTS "Super admins can view all records" ON public.super_admins;
DROP POLICY IF EXISTS "Super admins can view their own record" ON public.super_admins;
DROP POLICY IF EXISTS "Super admins can create new super admins" ON public.super_admins;
DROP POLICY IF EXISTS "Super admins can update super admin records" ON public.super_admins;
DROP POLICY IF EXISTS "Super admins can delete super admin records" ON public.super_admins;
DROP POLICY IF EXISTS "Allow initial super admin creation" ON public.super_admins;

-- Create ONE simple SELECT policy that allows users to view their own record
-- This is critical for login verification
CREATE POLICY "select_own_super_admin_record"
ON public.super_admins
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

-- Policy for super admins to view all super admin records
CREATE POLICY "select_all_super_admin_records"
ON public.super_admins
FOR SELECT
TO authenticated
USING (is_super_admin());

-- Allow initial super admin creation (first super admin)
CREATE POLICY "insert_first_super_admin"
ON public.super_admins
FOR INSERT
TO authenticated
WITH CHECK ((auth.uid() = auth_user_id) AND NOT EXISTS (SELECT 1 FROM public.super_admins));

-- Allow existing super admins to create new super admins
CREATE POLICY "insert_new_super_admins"
ON public.super_admins
FOR INSERT
TO authenticated
WITH CHECK (is_super_admin());

-- Allow super admins to update records
CREATE POLICY "update_super_admin_records"
ON public.super_admins
FOR UPDATE
TO authenticated
USING (is_super_admin());

-- Allow super admins to delete records
CREATE POLICY "delete_super_admin_records"
ON public.super_admins
FOR DELETE
TO authenticated
USING (is_super_admin());