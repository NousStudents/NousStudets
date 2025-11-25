-- Allow anyone (including unauthenticated users) to view schools list
-- This is needed for the signup page where users select their school
CREATE POLICY "Anyone can view schools list"
ON public.schools
FOR SELECT
TO public
USING (true);