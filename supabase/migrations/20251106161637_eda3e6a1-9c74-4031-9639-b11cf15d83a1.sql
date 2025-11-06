-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SCHOOLS TABLE (tenant root)
CREATE TABLE IF NOT EXISTS public.schools (
  school_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_name VARCHAR(100) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  phone VARCHAR(15),
  email VARCHAR(100),
  website VARCHAR(100),
  subdomain VARCHAR(50) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools are viewable by their members" ON public.schools
  FOR SELECT USING (true);

-- 2. USERS TABLE (with tenant scope)
CREATE TABLE IF NOT EXISTS public.users (
  user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(15),
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view users in their school" ON public.users
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth_user_id = auth.uid());

-- 3. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
  student_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  class_id UUID,
  section VARCHAR(10),
  roll_no VARCHAR(20),
  dob DATE,
  gender VARCHAR(10),
  admission_date DATE,
  parent_id UUID,
  profile_picture TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students viewable by school members" ON public.students
  FOR SELECT USING (
    user_id IN (
      SELECT user_id FROM public.users WHERE school_id IN (
        SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- 4. PARENTS TABLE
CREATE TABLE IF NOT EXISTS public.parents (
  parent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  relation VARCHAR(20) CHECK (relation IN ('father', 'mother', 'guardian')),
  occupation VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents viewable by school members" ON public.parents
  FOR SELECT USING (
    user_id IN (
      SELECT user_id FROM public.users WHERE school_id IN (
        SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- 5. TEACHERS TABLE
CREATE TABLE IF NOT EXISTS public.teachers (
  teacher_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  qualification VARCHAR(100),
  experience INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers viewable by school members" ON public.teachers
  FOR SELECT USING (
    user_id IN (
      SELECT user_id FROM public.users WHERE school_id IN (
        SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- 6. CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.classes (
  class_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  class_name VARCHAR(20) NOT NULL,
  section VARCHAR(10),
  class_teacher_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Classes viewable by school members" ON public.classes
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- 7. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS public.subjects (
  subject_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES public.classes(class_id) ON DELETE CASCADE,
  subject_name VARCHAR(50) NOT NULL,
  teacher_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subjects viewable by school members" ON public.subjects
  FOR SELECT USING (
    class_id IN (
      SELECT class_id FROM public.classes WHERE school_id IN (
        SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- 8. TIMETABLE TABLE
CREATE TABLE IF NOT EXISTS public.timetable (
  timetable_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES public.classes(class_id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(subject_id) ON DELETE CASCADE,
  teacher_id UUID,
  day_of_week VARCHAR(10) CHECK (day_of_week IN ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat')),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Timetable viewable by school members" ON public.timetable
  FOR SELECT USING (
    class_id IN (
      SELECT class_id FROM public.classes WHERE school_id IN (
        SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- 9. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS public.attendance (
  attendance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(class_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('present', 'absent', 'late')),
  marked_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendance viewable by school members" ON public.attendance
  FOR SELECT USING (
    class_id IN (
      SELECT class_id FROM public.classes WHERE school_id IN (
        SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- 10. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assignments (
  assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES public.classes(class_id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(subject_id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  due_date DATE,
  max_marks DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assignments viewable by school members" ON public.assignments
  FOR SELECT USING (
    class_id IN (
      SELECT class_id FROM public.classes WHERE school_id IN (
        SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- 11. SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.submissions (
  submission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(assignment_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
  submission_file TEXT,
  submission_text TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  marks_obtained DECIMAL(10, 2),
  feedback TEXT,
  graded_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Submissions viewable by school members" ON public.submissions
  FOR SELECT USING (
    assignment_id IN (
      SELECT assignment_id FROM public.assignments WHERE class_id IN (
        SELECT class_id FROM public.classes WHERE school_id IN (
          SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
        )
      )
    )
  );

-- 12. EXAMS TABLE
CREATE TABLE IF NOT EXISTS public.exams (
  exam_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(class_id) ON DELETE CASCADE,
  exam_name VARCHAR(50) NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exams viewable by school members" ON public.exams
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- 13. EXAM_TIMETABLE TABLE
CREATE TABLE IF NOT EXISTS public.exam_timetable (
  timetable_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES public.exams(exam_id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(subject_id) ON DELETE CASCADE,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room_no VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.exam_timetable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exam timetable viewable by school members" ON public.exam_timetable
  FOR SELECT USING (
    exam_id IN (
      SELECT exam_id FROM public.exams WHERE school_id IN (
        SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- 14. EXAM_RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.exam_results (
  result_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES public.exams(exam_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(subject_id) ON DELETE CASCADE,
  marks_obtained DECIMAL(10, 2),
  max_marks DECIMAL(10, 2),
  grade VARCHAR(5),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exam results viewable by school members" ON public.exam_results
  FOR SELECT USING (
    exam_id IN (
      SELECT exam_id FROM public.exams WHERE school_id IN (
        SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- 15. FEES TABLE
CREATE TABLE IF NOT EXISTS public.fees (
  fee_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue')),
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Fees viewable by school members" ON public.fees
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- 16. LIBRARY_BOOKS TABLE
CREATE TABLE IF NOT EXISTS public.library_books (
  book_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  author VARCHAR(100),
  isbn VARCHAR(30),
  total_copies INT DEFAULT 1,
  available_copies INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.library_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Library books viewable by school members" ON public.library_books
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- 17. LIBRARY_ISSUES TABLE
CREATE TABLE IF NOT EXISTS public.library_issues (
  issue_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES public.library_books(book_id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  return_date DATE,
  status VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.library_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Library issues viewable by school members" ON public.library_issues
  FOR SELECT USING (
    book_id IN (
      SELECT book_id FROM public.library_books WHERE school_id IN (
        SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- 18. TRANSPORT TABLE
CREATE TABLE IF NOT EXISTS public.transport (
  transport_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  route_name VARCHAR(50) NOT NULL,
  driver_name VARCHAR(100),
  vehicle_no VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.transport ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transport viewable by school members" ON public.transport
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- 19. INVENTORY TABLE
CREATE TABLE IF NOT EXISTS public.inventory (
  item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  item_name VARCHAR(100) NOT NULL,
  quantity INT DEFAULT 0,
  condition VARCHAR(50),
  purchase_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inventory viewable by school members" ON public.inventory
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- 20. EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.events (
  event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  event_name VARCHAR(100) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events viewable by school members" ON public.events
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
    )
  );

-- 21. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.messages (
  message_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Messages viewable by sender or receiver" ON public.messages
  FOR SELECT USING (
    sender_id IN (SELECT user_id FROM public.users WHERE auth_user_id = auth.uid())
    OR receiver_id IN (SELECT user_id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- 22. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
  notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type VARCHAR(20) CHECK (type IN ('email', 'push', 'in-app')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('sent', 'pending')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notifications viewable by recipient" ON public.notifications
  FOR SELECT USING (
    user_id IN (SELECT user_id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- 23. PAYROLL TABLE
CREATE TABLE IF NOT EXISTS public.payroll (
  payroll_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(teacher_id) ON DELETE CASCADE,
  month VARCHAR(20) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('paid', 'pending')),
  payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payroll viewable by recipient teacher" ON public.payroll
  FOR SELECT USING (
    teacher_id IN (
      SELECT teacher_id FROM public.teachers WHERE user_id IN (
        SELECT user_id FROM public.users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- 24. AI_TOOLS TABLE
CREATE TABLE IF NOT EXISTS public.ai_tools (
  ai_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  feature_type VARCHAR(30) CHECK (feature_type IN ('summary', 'quiz_generator', 'notes_generator', 'tutor_chat')),
  input_type VARCHAR(20) CHECK (input_type IN ('video', 'text')),
  input_content TEXT,
  result_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ai_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI tools viewable by owner" ON public.ai_tools
  FOR SELECT USING (
    user_id IN (SELECT user_id FROM public.users WHERE auth_user_id = auth.uid())
  );

-- Create indexes for performance
CREATE INDEX idx_users_school_id ON public.users(school_id);
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_classes_school_id ON public.classes(school_id);
CREATE INDEX idx_attendance_student_date ON public.attendance(student_id, date);
CREATE INDEX idx_assignments_class_id ON public.assignments(class_id);
CREATE INDEX idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();