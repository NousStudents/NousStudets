-- Create admins table for admin-specific information
CREATE TABLE public.admins (
  admin_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  department CHARACTER VARYING,
  admin_level CHARACTER VARYING,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Admins can view all admins in their school
CREATE POLICY "Admins viewable by school members"
ON public.admins
FOR SELECT
USING (
  user_id IN (
    SELECT user_id FROM public.users
    WHERE school_id = current_school_id()
  )
);

-- Admins can manage other admins in their school
CREATE POLICY "Admins can manage admins"
ON public.admins
FOR ALL
USING (
  has_role(current_user_id(), 'admin') 
  AND user_id IN (
    SELECT user_id FROM public.users
    WHERE school_id = current_school_id()
  )
)
WITH CHECK (
  has_role(current_user_id(), 'admin')
  AND user_id IN (
    SELECT user_id FROM public.users
    WHERE school_id = current_school_id()
  )
);

-- Create index for better query performance
CREATE INDEX idx_admins_user_id ON public.admins(user_id);