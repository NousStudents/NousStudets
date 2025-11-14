-- Fix RLS policies for super_admins table to allow users to check their own status
DROP POLICY IF EXISTS "Super admins can view all super admins" ON public.super_admins;

-- Allow authenticated users to check if they are super admins
CREATE POLICY "Users can check their own super admin status"
ON public.super_admins
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

-- Allow super admins to view all super admins
CREATE POLICY "Super admins can view all super admins"
ON public.super_admins
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.super_admins
    WHERE auth_user_id = auth.uid()
    AND status = 'active'
  )
);