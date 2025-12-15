-- Allow admins to view their own record for role verification
CREATE POLICY "Admins can view their own record"
ON public.admins
FOR SELECT
USING (auth.uid() = auth_user_id);