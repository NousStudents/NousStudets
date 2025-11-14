-- Create super_admins table for system-level administrators
CREATE TABLE IF NOT EXISTS public.super_admins (
  super_admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL,
  email VARCHAR NOT NULL UNIQUE,
  full_name VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  status VARCHAR DEFAULT 'active'
);

-- Enable RLS
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins 
    WHERE auth_user_id = auth.uid() AND status = 'active'
  );
$$;

-- Policy: Super admins can view their own record
CREATE POLICY "Super admins can view their own record"
ON public.super_admins
FOR SELECT
USING (auth.uid() = auth_user_id);

-- Policy: Allow initial super admin creation (first user only)
CREATE POLICY "Allow initial super admin creation"
ON public.super_admins
FOR INSERT
WITH CHECK (
  auth.uid() = auth_user_id AND
  NOT EXISTS (SELECT 1 FROM public.super_admins)
);

-- Policy: Super admins can manage schools
CREATE POLICY "Super admins can view all schools"
ON public.schools
FOR SELECT
USING (is_super_admin());

CREATE POLICY "Super admins can create schools"
ON public.schools
FOR INSERT
WITH CHECK (is_super_admin());

CREATE POLICY "Super admins can update schools"
ON public.schools
FOR UPDATE
USING (is_super_admin());

-- Policy: Super admins can view all admins
CREATE POLICY "Super admins can view all admins"
ON public.admins
FOR SELECT
USING (is_super_admin());

CREATE POLICY "Super admins can create admins"
ON public.admins
FOR INSERT
WITH CHECK (is_super_admin());