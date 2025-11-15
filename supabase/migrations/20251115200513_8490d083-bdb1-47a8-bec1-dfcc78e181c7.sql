-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create users table
CREATE TABLE public.users (
  user_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid,
  full_name text,
  email text UNIQUE,
  phone text,
  role text,
  school_id uuid REFERENCES public.schools(school_id),
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own record"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can view all users in their school"
ON public.users
FOR SELECT
TO authenticated
USING (
  has_role('admin'::text) 
  AND school_id = current_school_id()
);

CREATE POLICY "Super admins can view all users"
ON public.users
FOR SELECT
TO authenticated
USING (is_super_admin());

CREATE POLICY "Admins can manage users in their school"
ON public.users
FOR ALL
TO authenticated
USING (
  has_role('admin'::text) 
  AND school_id = current_school_id()
);

CREATE POLICY "Super admins can manage all users"
ON public.users
FOR ALL
TO authenticated
USING (is_super_admin());