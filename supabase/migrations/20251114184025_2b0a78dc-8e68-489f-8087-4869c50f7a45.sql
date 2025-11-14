-- Fix infinite recursion in super_admins RLS policies
-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Users can check their own super admin status" ON public.super_admins;
DROP POLICY IF EXISTS "Super admins can view all super admins" ON public.super_admins;

-- Create a security definer function to check super admin status without recursion
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.super_admins
    WHERE auth_user_id = auth.uid()
    AND status = 'active'
  )
$$;

-- Create simple policies using the security definer function
CREATE POLICY "Users can check their own super admin status"
ON public.super_admins
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

CREATE POLICY "Super admins can view all super admins"
ON public.super_admins
FOR SELECT
TO authenticated
USING (public.is_super_admin());

-- Allow super admins to insert new super admins
CREATE POLICY "Super admins can insert super admins"
ON public.super_admins
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());