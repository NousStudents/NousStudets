-- Drop the conflicting restrictive policy that requires existing super admin
DROP POLICY IF EXISTS "insert_new_super_admins" ON public.super_admins;

-- Ensure the correct policy exists for self-registration
DROP POLICY IF EXISTS "Users can create their own super admin record" ON public.super_admins;
CREATE POLICY "Users can create their own super admin record" 
ON public.super_admins 
FOR INSERT 
WITH CHECK (auth.uid() = auth_user_id);