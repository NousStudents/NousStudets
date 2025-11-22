-- Create timetable_templates table for saving and reusing timetable configurations
CREATE TABLE IF NOT EXISTS public.timetable_templates (
  template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  description TEXT,
  school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  configuration JSONB NOT NULL, -- Stores the entire timetable structure
  metadata JSONB DEFAULT '{}'::jsonb -- Additional settings like periods per day, days per week
);

-- Add RLS policies
ALTER TABLE public.timetable_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates in their school"
ON public.timetable_templates
FOR ALL
USING (
  has_role('admin'::text) AND school_id = current_school_id()
);

-- Create index for performance
CREATE INDEX idx_timetable_templates_school_id ON public.timetable_templates(school_id);
CREATE INDEX idx_timetable_templates_created_by ON public.timetable_templates(created_by);

-- Add trigger for updated_at
CREATE TRIGGER update_timetable_templates_updated_at
  BEFORE UPDATE ON public.timetable_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();