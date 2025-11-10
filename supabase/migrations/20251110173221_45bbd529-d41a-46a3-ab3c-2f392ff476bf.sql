-- Fix referential integrity: add CASCADE rules for role tables
ALTER TABLE public.students 
  DROP CONSTRAINT IF EXISTS students_user_id_fkey,
  ADD CONSTRAINT students_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.users(user_id) 
    ON DELETE CASCADE;

ALTER TABLE public.teachers 
  DROP CONSTRAINT IF EXISTS teachers_user_id_fkey,
  ADD CONSTRAINT teachers_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.users(user_id) 
    ON DELETE CASCADE;

ALTER TABLE public.parents 
  DROP CONSTRAINT IF EXISTS parents_user_id_fkey,
  ADD CONSTRAINT parents_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES public.users(user_id) 
    ON DELETE CASCADE;

-- Add DELETE policy for users table (admins can delete users in their school)
CREATE POLICY "Admins can delete users in their school"
ON public.users
FOR DELETE
TO authenticated
USING (
  has_role(current_user_id(), 'admin'::app_role) 
  AND school_id = current_school_id()
);

-- Update students UPDATE policy to allow admins to update any student in their school
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
CREATE POLICY "Admins can manage students"
ON public.students
FOR ALL
TO authenticated
USING (
  has_role(current_user_id(), 'admin'::app_role) 
  AND user_id IN (
    SELECT user_id FROM public.users WHERE school_id = current_school_id()
  )
)
WITH CHECK (
  has_role(current_user_id(), 'admin'::app_role) 
  AND user_id IN (
    SELECT user_id FROM public.users WHERE school_id = current_school_id()
  )
);

-- Update users UPDATE policy to allow admins to update any user in their school
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid() OR (has_role(current_user_id(), 'admin'::app_role) AND school_id = current_school_id()))
WITH CHECK (auth_user_id = auth.uid() OR (has_role(current_user_id(), 'admin'::app_role) AND school_id = current_school_id()));