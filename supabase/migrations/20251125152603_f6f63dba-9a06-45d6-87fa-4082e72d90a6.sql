-- Fix the timetable day_of_week check constraint to allow all days
-- First, drop the existing constraint if it exists
ALTER TABLE public.timetable DROP CONSTRAINT IF EXISTS timetable_day_of_week_check;

-- Add a new constraint with all valid day names
ALTER TABLE public.timetable
ADD CONSTRAINT timetable_day_of_week_check 
CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'));

-- Create a period_types table to support different types of periods
CREATE TABLE IF NOT EXISTS public.period_types (
  period_type_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name text NOT NULL,
  color_code text,
  created_at timestamp with time zone DEFAULT now()
);

-- Insert default period types
INSERT INTO public.period_types (type_name, color_code) VALUES
  ('Regular Class', '#3b82f6'),
  ('Breakfast', '#f59e0b'),
  ('Lunch Break', '#10b981'),
  ('Games/PT', '#8b5cf6'),
  ('Computer Lab', '#06b6d4'),
  ('Science Lab', '#ec4899'),
  ('Library', '#14b8a6'),
  ('Free Period', '#6b7280'),
  ('Substitution', '#ef4444')
ON CONFLICT DO NOTHING;

-- Add period_type_id to timetable table to support different period types
ALTER TABLE public.timetable 
ADD COLUMN IF NOT EXISTS period_type_id uuid REFERENCES public.period_types(period_type_id),
ADD COLUMN IF NOT EXISTS period_name text,
ADD COLUMN IF NOT EXISTS is_break boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS room_number text;

-- Enable RLS on period_types
ALTER TABLE public.period_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for period_types (everyone can view)
CREATE POLICY "Anyone can view period types"
ON public.period_types
FOR SELECT
TO public
USING (true);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_timetable_day_time ON public.timetable(day_of_week, start_time);