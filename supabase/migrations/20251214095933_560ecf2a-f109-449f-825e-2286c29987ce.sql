-- Allow any authenticated user to check if they are a super admin (for login verification)
DROP POLICY IF EXISTS "Super admins can view their own record" ON public.super_admins;

CREATE POLICY "Authenticated users can check their super admin status" 
ON public.super_admins 
FOR SELECT 
TO authenticated
USING (auth.uid() = auth_user_id);