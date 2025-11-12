-- STEP 6: Drop old functions and create new ones

-- Drop old functions (CASCADE to handle any remaining dependencies)
DROP FUNCTION IF EXISTS public.current_user_id() CASCADE;
DROP FUNCTION IF EXISTS public.current_school_id() CASCADE;
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role) CASCADE;
DROP FUNCTION IF EXISTS public.get_teacher_school_id(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.log_user_creation(uuid, uuid, jsonb) CASCADE;

-- Create new get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    CASE
      WHEN EXISTS (SELECT 1 FROM public.admins WHERE auth_user_id = auth.uid()) THEN 'admin'
      WHEN EXISTS (SELECT 1 FROM public.teachers WHERE auth_user_id = auth.uid()) THEN 'teacher'
      WHEN EXISTS (SELECT 1 FROM public.students WHERE auth_user_id = auth.uid()) THEN 'student'
      WHEN EXISTS (SELECT 1 FROM public.parents WHERE auth_user_id = auth.uid()) THEN 'parent'
      ELSE NULL
    END;
$$;

-- Create new current_school_id function
CREATE OR REPLACE FUNCTION public.current_school_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    COALESCE(
      (SELECT school_id FROM public.admins WHERE auth_user_id = auth.uid()),
      (SELECT school_id FROM public.teachers WHERE auth_user_id = auth.uid()),
      (SELECT c.school_id FROM public.students s JOIN public.classes c ON s.class_id = c.class_id WHERE s.auth_user_id = auth.uid()),
      (SELECT school_id FROM public.parents WHERE auth_user_id = auth.uid())
    );
$$;

-- Create new has_role function (now checks table membership)
CREATE OR REPLACE FUNCTION public.has_role(_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    CASE _role
      WHEN 'admin' THEN EXISTS (SELECT 1 FROM public.admins WHERE auth_user_id = auth.uid())
      WHEN 'teacher' THEN EXISTS (SELECT 1 FROM public.teachers WHERE auth_user_id = auth.uid())
      WHEN 'student' THEN EXISTS (SELECT 1 FROM public.students WHERE auth_user_id = auth.uid())
      WHEN 'parent' THEN EXISTS (SELECT 1 FROM public.parents WHERE auth_user_id = auth.uid())
      ELSE FALSE
    END;
$$;

-- Helper function to get teacher_id from auth user
CREATE OR REPLACE FUNCTION public.get_teacher_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT teacher_id FROM public.teachers WHERE auth_user_id = auth.uid();
$$;

-- Helper function to get student_id from auth user
CREATE OR REPLACE FUNCTION public.get_student_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT student_id FROM public.students WHERE auth_user_id = auth.uid();
$$;

-- Helper function to get parent_id from auth user
CREATE OR REPLACE FUNCTION public.get_parent_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT parent_id FROM public.parents WHERE auth_user_id = auth.uid();
$$;

-- Helper function to get admin_id from auth user
CREATE OR REPLACE FUNCTION public.get_admin_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT admin_id FROM public.admins WHERE auth_user_id = auth.uid();
$$;