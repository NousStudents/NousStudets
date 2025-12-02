-- Drop the restrictive first super admin policy
DROP POLICY IF EXISTS "insert_first_super_admin" ON public.super_admins;

-- Create a policy that allows authenticated users to insert their own super admin record
CREATE POLICY "Users can create their own super admin record"
ON public.super_admins
FOR INSERT
WITH CHECK (auth.uid() = auth_user_id);