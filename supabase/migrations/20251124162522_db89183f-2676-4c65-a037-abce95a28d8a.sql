-- Create activities table for tracking user and system events
CREATE TABLE public.activities (
  activity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  actor_id UUID,
  actor_name TEXT,
  actor_role TEXT,
  activity_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  target_user_id UUID,
  target_class_id UUID,
  target_subject_id UUID
);

-- Create index for faster queries
CREATE INDEX idx_activities_school_created ON public.activities(school_id, created_at DESC);
CREATE INDEX idx_activities_type ON public.activities(activity_type);
CREATE INDEX idx_activities_actor ON public.activities(actor_id);
CREATE INDEX idx_activities_target_user ON public.activities(target_user_id);

-- Enable RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Admins can view all activities in their school
CREATE POLICY "Admins can view all school activities"
ON public.activities
FOR SELECT
TO authenticated
USING (
  has_role('admin') AND school_id = current_school_id()
);

-- Teachers can view activities related to their classes and students
CREATE POLICY "Teachers can view relevant activities"
ON public.activities
FOR SELECT
TO authenticated
USING (
  has_role('teacher') AND 
  school_id = current_school_id() AND
  (
    actor_id = get_teacher_id() OR
    target_class_id IN (
      SELECT class_id FROM classes 
      WHERE class_teacher_id = get_teacher_id()
    ) OR
    target_subject_id IN (
      SELECT subject_id FROM subjects 
      WHERE teacher_id = get_teacher_id()
    )
  )
);

-- Students can view their own activities
CREATE POLICY "Students can view own activities"
ON public.activities
FOR SELECT
TO authenticated
USING (
  has_role('student') AND 
  school_id = current_school_id() AND
  (
    actor_id = get_student_id() OR
    target_user_id = get_student_id()
  )
);

-- Parents can view activities related to their children
CREATE POLICY "Parents can view children activities"
ON public.activities
FOR SELECT
TO authenticated
USING (
  has_role('parent') AND 
  school_id = current_school_id() AND
  target_user_id IN (
    SELECT student_id FROM students 
    WHERE parent_id = get_parent_id()
  )
);

-- Admins and teachers can insert activities
CREATE POLICY "Staff can insert activities"
ON public.activities
FOR INSERT
TO authenticated
WITH CHECK (
  (has_role('admin') OR has_role('teacher')) AND
  school_id = current_school_id()
);

-- System can insert activities (for automated events)
CREATE POLICY "System can insert activities"
ON public.activities
FOR INSERT
TO authenticated
WITH CHECK (
  school_id = current_school_id()
);

-- Enable realtime for activities
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;