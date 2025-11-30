-- Allow students to update their own profile information
CREATE POLICY "Students can update their own profile"
ON students
FOR UPDATE
TO authenticated
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);