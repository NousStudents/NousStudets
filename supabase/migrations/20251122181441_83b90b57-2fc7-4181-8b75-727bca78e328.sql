
-- Add RLS policies to allow users to view their own role records during login
-- This fixes the "Unknown role" error by allowing role verification queries to succeed

-- Allow teachers to view their own record
CREATE POLICY "Teachers can view their own record"
ON public.teachers
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

-- Allow students to view their own record
CREATE POLICY "Students can view their own record"
ON public.students
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

-- Allow parents to view their own record
CREATE POLICY "Parents can view their own record"
ON public.parents
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);
