-- Add assignment_students table for individual student assignments
CREATE TABLE IF NOT EXISTS public.assignment_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(assignment_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(assignment_id, student_id)
);

-- Add RLS policies for assignment_students
ALTER TABLE public.assignment_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage assignment students"
  ON public.assignment_students
  FOR ALL
  USING (
    assignment_id IN (
      SELECT assignment_id 
      FROM assignments 
      WHERE teacher_id = get_teacher_id()
    )
  );

CREATE POLICY "Students can view their assignments"
  ON public.assignment_students
  FOR SELECT
  USING (student_id = get_student_id());

-- Add file_url to assignments table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assignments' AND column_name = 'file_url'
  ) THEN
    ALTER TABLE public.assignments ADD COLUMN file_url TEXT;
  END IF;
END $$;

-- Update assignments RLS to allow students to view their assignments
DROP POLICY IF EXISTS "Students can view class assignments" ON public.assignments;

CREATE POLICY "Students can view their assignments"
  ON public.assignments
  FOR SELECT
  USING (
    has_role('student') AND (
      class_id IN (
        SELECT class_id FROM students WHERE student_id = get_student_id()
      )
      OR assignment_id IN (
        SELECT assignment_id FROM assignment_students WHERE student_id = get_student_id()
      )
    )
  );

-- Update teachers view policy
DROP POLICY IF EXISTS "Teachers can view assignments" ON public.assignments;

CREATE POLICY "Teachers can view their assignments"
  ON public.assignments
  FOR SELECT
  USING (
    has_role('teacher') AND (
      teacher_id = get_teacher_id()
      OR class_id IN (
        SELECT DISTINCT class_id FROM timetable WHERE teacher_id = get_teacher_id()
      )
    )
  );

-- Create assignment_files storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('assignment-files', 'assignment-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for assignment files
CREATE POLICY "Teachers can upload assignment files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'assignment-files' AND
    auth.uid() IN (SELECT auth_user_id FROM teachers)
  );

CREATE POLICY "Teachers can view assignment files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'assignment-files' AND
    auth.uid() IN (SELECT auth_user_id FROM teachers)
  );

CREATE POLICY "Students can view assignment files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'assignment-files' AND
    auth.uid() IN (SELECT auth_user_id FROM students)
  );