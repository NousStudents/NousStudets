-- Create leave_requests table
CREATE TABLE public.leave_requests (
  leave_request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(class_id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.teachers(teacher_id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE
);

-- Create class_announcements table
CREATE TABLE public.class_announcements (
  announcement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(class_id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.teachers(teacher_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leave_requests
CREATE POLICY "Students can create leave requests"
  ON public.leave_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role('student') 
    AND student_id = get_student_id()
    AND school_id = current_school_id()
  );

CREATE POLICY "Students can view their leave requests"
  ON public.leave_requests
  FOR SELECT
  TO authenticated
  USING (
    (has_role('student') AND student_id = get_student_id())
    OR (has_role('teacher') AND class_id IN (
      SELECT class_id FROM public.classes WHERE class_teacher_id = get_teacher_id()
    ))
    OR has_role('admin')
  );

CREATE POLICY "Class teachers can update leave requests"
  ON public.leave_requests
  FOR UPDATE
  TO authenticated
  USING (
    (has_role('teacher') AND class_id IN (
      SELECT class_id FROM public.classes WHERE class_teacher_id = get_teacher_id()
    ))
    OR has_role('admin')
  );

-- RLS Policies for class_announcements
CREATE POLICY "Class teachers can create announcements"
  ON public.class_announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (has_role('teacher') AND teacher_id = get_teacher_id() AND class_id IN (
      SELECT class_id FROM public.classes WHERE class_teacher_id = get_teacher_id()
    ))
    OR has_role('admin')
  );

CREATE POLICY "Students and teachers can view announcements"
  ON public.class_announcements
  FOR SELECT
  TO authenticated
  USING (
    (has_role('student') AND class_id IN (
      SELECT class_id FROM public.students WHERE student_id = get_student_id()
    ))
    OR (has_role('teacher') AND class_id IN (
      SELECT class_id FROM public.classes WHERE class_teacher_id = get_teacher_id()
    ))
    OR has_role('admin')
  );

CREATE POLICY "Class teachers can update their announcements"
  ON public.class_announcements
  FOR UPDATE
  TO authenticated
  USING (
    (has_role('teacher') AND teacher_id = get_teacher_id())
    OR has_role('admin')
  );

CREATE POLICY "Class teachers can delete their announcements"
  ON public.class_announcements
  FOR DELETE
  TO authenticated
  USING (
    (has_role('teacher') AND teacher_id = get_teacher_id())
    OR has_role('admin')
  );

-- Create index for better performance
CREATE INDEX idx_leave_requests_class_id ON public.leave_requests(class_id);
CREATE INDEX idx_leave_requests_student_id ON public.leave_requests(student_id);
CREATE INDEX idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX idx_class_announcements_class_id ON public.class_announcements(class_id);