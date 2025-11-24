-- Create allowed_students table for email whitelisting
CREATE TABLE IF NOT EXISTS public.allowed_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  class_id UUID REFERENCES public.classes(class_id) ON DELETE SET NULL,
  section VARCHAR,
  roll_no VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(school_id, email)
);

-- Enable RLS
ALTER TABLE public.allowed_students ENABLE ROW LEVEL SECURITY;

-- Admins can manage whitelisted students for their school
CREATE POLICY "Admins can manage allowed students"
ON public.allowed_students
FOR ALL
USING (
  has_role('admin') AND school_id = current_school_id()
)
WITH CHECK (
  has_role('admin') AND school_id = current_school_id()
);

-- Create index for faster lookups
CREATE INDEX idx_allowed_students_email ON public.allowed_students(school_id, email);