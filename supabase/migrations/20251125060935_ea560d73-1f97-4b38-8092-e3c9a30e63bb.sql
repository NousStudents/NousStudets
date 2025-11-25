-- Create whitelisted_teachers table
CREATE TABLE IF NOT EXISTS public.whitelisted_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  department VARCHAR,
  subject_specialization TEXT,
  employee_id VARCHAR,
  phone VARCHAR,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  UNIQUE(school_id, email)
);

-- Create whitelisted_parents table
CREATE TABLE IF NOT EXISTS public.whitelisted_parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  email VARCHAR NOT NULL,
  full_name VARCHAR NOT NULL,
  phone VARCHAR,
  relation VARCHAR,
  student_ids UUID[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  UNIQUE(school_id, email)
);

-- Enable RLS on whitelisted_teachers
ALTER TABLE public.whitelisted_teachers ENABLE ROW LEVEL SECURITY;

-- Enable RLS on whitelisted_parents
ALTER TABLE public.whitelisted_parents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whitelisted_teachers
CREATE POLICY "Admins can manage whitelisted teachers"
  ON public.whitelisted_teachers
  FOR ALL
  USING (has_role('admin') AND school_id = current_school_id())
  WITH CHECK (has_role('admin') AND school_id = current_school_id());

-- RLS Policies for whitelisted_parents
CREATE POLICY "Admins can manage whitelisted parents"
  ON public.whitelisted_parents
  FOR ALL
  USING (has_role('admin') AND school_id = current_school_id())
  WITH CHECK (has_role('admin') AND school_id = current_school_id());