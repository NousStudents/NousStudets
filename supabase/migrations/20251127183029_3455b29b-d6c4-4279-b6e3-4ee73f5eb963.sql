-- Create AI Lesson Plans table
CREATE TABLE IF NOT EXISTS public.ai_lesson_plans (
  plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(teacher_id),
  subject_id UUID REFERENCES public.subjects(subject_id),
  class_id UUID REFERENCES public.classes(class_id),
  topic TEXT NOT NULL,
  grade_level TEXT,
  duration_minutes INTEGER,
  lesson_content JSONB NOT NULL, -- stores structured lesson plan
  teaching_steps JSONB,
  activities JSONB,
  learning_outcomes JSONB,
  examples JSONB,
  resources TEXT[],
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create AI Generated Assignments table
CREATE TABLE IF NOT EXISTS public.ai_generated_assignments (
  generated_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(teacher_id),
  subject_id UUID REFERENCES public.subjects(subject_id),
  class_id UUID REFERENCES public.classes(class_id),
  assignment_type TEXT NOT NULL, -- 'mcq', 'short_answer', 'descriptive', 'coding', 'full_paper'
  topic TEXT NOT NULL,
  difficulty_level TEXT, -- 'easy', 'medium', 'hard'
  questions JSONB NOT NULL, -- array of questions with answers
  answer_key JSONB,
  max_marks INTEGER,
  auto_gradable BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create AI Attendance Analysis table
CREATE TABLE IF NOT EXISTS public.ai_attendance_analysis (
  analysis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(teacher_id),
  class_id UUID NOT NULL REFERENCES public.classes(class_id),
  analysis_date DATE DEFAULT CURRENT_DATE,
  frequent_absentees JSONB, -- student_id, absence_count, percentage
  predicted_dropouts JSONB, -- student_id, risk_level, reasons
  recommendations TEXT,
  insights TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create AI Report Comments table
CREATE TABLE IF NOT EXISTS public.ai_report_comments (
  comment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(teacher_id),
  student_id UUID NOT NULL REFERENCES public.students(student_id),
  subject_id UUID REFERENCES public.subjects(subject_id),
  exam_id UUID REFERENCES public.exams(exam_id),
  comment_text TEXT NOT NULL,
  performance_summary TEXT,
  strengths TEXT[],
  areas_for_improvement TEXT[],
  attendance_remarks TEXT,
  behavior_remarks TEXT,
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_lesson_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generated_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_attendance_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_report_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_lesson_plans
CREATE POLICY "Teachers can manage their lesson plans"
ON public.ai_lesson_plans
FOR ALL
USING (teacher_id = get_teacher_id())
WITH CHECK (teacher_id = get_teacher_id());

CREATE POLICY "Admins can view all lesson plans"
ON public.ai_lesson_plans
FOR SELECT
USING (has_role('admin'));

-- RLS Policies for ai_generated_assignments
CREATE POLICY "Teachers can manage their generated assignments"
ON public.ai_generated_assignments
FOR ALL
USING (teacher_id = get_teacher_id())
WITH CHECK (teacher_id = get_teacher_id());

CREATE POLICY "Admins can view all generated assignments"
ON public.ai_generated_assignments
FOR SELECT
USING (has_role('admin'));

-- RLS Policies for ai_attendance_analysis
CREATE POLICY "Teachers can manage their attendance analysis"
ON public.ai_attendance_analysis
FOR ALL
USING (teacher_id = get_teacher_id())
WITH CHECK (teacher_id = get_teacher_id());

CREATE POLICY "Admins can view all attendance analysis"
ON public.ai_attendance_analysis
FOR SELECT
USING (has_role('admin'));

-- RLS Policies for ai_report_comments
CREATE POLICY "Teachers can manage their report comments"
ON public.ai_report_comments
FOR ALL
USING (teacher_id = get_teacher_id())
WITH CHECK (teacher_id = get_teacher_id());

CREATE POLICY "Students can view their report comments"
ON public.ai_report_comments
FOR SELECT
USING (student_id = get_student_id());

CREATE POLICY "Parents can view their children's report comments"
ON public.ai_report_comments
FOR SELECT
USING (student_id IN (
  SELECT student_id FROM public.students WHERE parent_id = get_parent_id()
));

CREATE POLICY "Admins can view all report comments"
ON public.ai_report_comments
FOR SELECT
USING (has_role('admin'));

-- Create indexes for performance
CREATE INDEX idx_lesson_plans_teacher ON public.ai_lesson_plans(teacher_id);
CREATE INDEX idx_lesson_plans_subject ON public.ai_lesson_plans(subject_id);
CREATE INDEX idx_generated_assignments_teacher ON public.ai_generated_assignments(teacher_id);
CREATE INDEX idx_attendance_analysis_teacher ON public.ai_attendance_analysis(teacher_id);
CREATE INDEX idx_attendance_analysis_class ON public.ai_attendance_analysis(class_id);
CREATE INDEX idx_report_comments_teacher ON public.ai_report_comments(teacher_id);
CREATE INDEX idx_report_comments_student ON public.ai_report_comments(student_id);