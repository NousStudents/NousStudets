-- Drop all existing policies on super_admins
DROP POLICY IF EXISTS "Users can check their own super admin status" ON public.super_admins;
DROP POLICY IF EXISTS "Super admins can view all super admins" ON public.super_admins;
DROP POLICY IF EXISTS "Super admins can insert super admins" ON public.super_admins;

-- Recreate simple, non-conflicting policies
-- Policy 1: Users can always check their OWN super admin status
CREATE POLICY "Users can view their own super admin record"
ON public.super_admins
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

-- Policy 2: Super admins can view ALL super admin records (uses security definer function)
CREATE POLICY "Super admins can view all records"
ON public.super_admins
FOR SELECT
TO authenticated
USING (
  public.is_super_admin() 
  OR auth.uid() = auth_user_id  -- Allow checking own status even if not super admin yet
);

-- Policy 3: Super admins can insert new super admins
CREATE POLICY "Super admins can create new super admins"
ON public.super_admins
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());

-- Policy 4: Super admins can update super admin records
CREATE POLICY "Super admins can update super admin records"
ON public.super_admins
FOR UPDATE
TO authenticated
USING (public.is_super_admin());

-- Policy 5: Super admins can delete super admin records
CREATE POLICY "Super admins can delete super admin records"
ON public.super_admins
FOR DELETE
TO authenticated
USING (public.is_super_admin());