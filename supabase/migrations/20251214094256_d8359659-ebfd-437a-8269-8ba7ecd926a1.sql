-- Ensure super admins can view their own record with a simpler policy
DROP POLICY IF EXISTS "select_own_super_admin_record" ON public.super_admins;

CREATE POLICY "Super admins can view their own record" 
ON public.super_admins 
FOR SELECT 
USING (auth.uid() = auth_user_id);