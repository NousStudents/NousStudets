-- ============================================
-- SECURE RBAC + MULTI-TENANCY IMPLEMENTATION
-- ============================================

-- 1) Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student', 'parent');

-- 2) Create user_roles table (SECURE - roles in separate table)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  role app_role NOT NULL,
  granted_by UUID REFERENCES public.users(user_id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3) Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4) Helper function to get user_id from auth.uid()
CREATE OR REPLACE FUNCTION public.current_user_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.users WHERE auth_user_id = auth.uid()
$$;

-- 5) Helper function to get current user's school_id
CREATE OR REPLACE FUNCTION public.current_school_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.users WHERE auth_user_id = auth.uid()
$$;

-- 6) RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = public.current_user_id());

CREATE POLICY "Admins can manage all roles in their school"
  ON public.user_roles FOR ALL
  USING (
    public.has_role(public.current_user_id(), 'admin')
    AND user_id IN (
      SELECT user_id FROM public.users 
      WHERE school_id = public.current_school_id()
    )
  );

-- 7) Migrate existing roles from users table to user_roles table
INSERT INTO public.user_roles (user_id, role, granted_at)
SELECT user_id, role::app_role, created_at
FROM public.users
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 8) Update existing RLS policies to use secure role checking

-- USERS TABLE POLICIES
DROP POLICY IF EXISTS "Users can view users in their school" ON public.users;
CREATE POLICY "Users can view users in their school"
  ON public.users FOR SELECT
  USING (school_id = public.current_school_id());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Admins can insert users in their school"
  ON public.users FOR INSERT
  WITH CHECK (
    public.has_role(public.current_user_id(), 'admin')
    AND school_id = public.current_school_id()
  );

-- TEACHERS TABLE POLICIES
DROP POLICY IF EXISTS "Teachers viewable by school members" ON public.teachers;
CREATE POLICY "Teachers viewable by school members"
  ON public.teachers FOR SELECT
  USING (
    user_id IN (
      SELECT user_id FROM public.users 
      WHERE school_id = public.current_school_id()
    )
  );

CREATE POLICY "Admins can manage teachers"
  ON public.teachers FOR ALL
  USING (
    public.has_role(public.current_user_id(), 'admin')
    AND user_id IN (
      SELECT user_id FROM public.users 
      WHERE school_id = public.current_school_id()
    )
  );

-- STUDENTS TABLE POLICIES
DROP POLICY IF EXISTS "Students viewable by school members" ON public.students;
CREATE POLICY "Students viewable by school members"
  ON public.students FOR SELECT
  USING (
    user_id IN (
      SELECT user_id FROM public.users 
      WHERE school_id = public.current_school_id()
    )
  );

CREATE POLICY "Admins can manage students"
  ON public.students FOR ALL
  USING (
    public.has_role(public.current_user_id(), 'admin')
    AND user_id IN (
      SELECT user_id FROM public.users 
      WHERE school_id = public.current_school_id()
    )
  );

-- ASSIGNMENTS - Teachers and Admins can create
CREATE POLICY "Teachers can create assignments"
  ON public.assignments FOR INSERT
  WITH CHECK (
    (public.has_role(public.current_user_id(), 'teacher') OR 
     public.has_role(public.current_user_id(), 'admin'))
    AND teacher_id IN (
      SELECT teacher_id FROM public.teachers 
      WHERE user_id = public.current_user_id()
    )
    AND class_id IN (
      SELECT class_id FROM public.classes 
      WHERE school_id = public.current_school_id()
    )
  );

CREATE POLICY "Teachers can update their assignments"
  ON public.assignments FOR UPDATE
  USING (
    teacher_id IN (
      SELECT teacher_id FROM public.teachers 
      WHERE user_id = public.current_user_id()
    )
  );

-- ATTENDANCE - Teachers can mark
CREATE POLICY "Teachers can mark attendance"
  ON public.attendance FOR INSERT
  WITH CHECK (
    (public.has_role(public.current_user_id(), 'teacher') OR 
     public.has_role(public.current_user_id(), 'admin'))
    AND class_id IN (
      SELECT class_id FROM public.classes 
      WHERE school_id = public.current_school_id()
    )
  );

CREATE POLICY "Teachers can update attendance"
  ON public.attendance FOR UPDATE
  USING (
    marked_by IN (
      SELECT teacher_id FROM public.teachers 
      WHERE user_id = public.current_user_id()
    )
  );

-- SUBMISSIONS - Students can submit
CREATE POLICY "Students can create submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (
    public.has_role(public.current_user_id(), 'student')
    AND student_id IN (
      SELECT student_id FROM public.students 
      WHERE user_id = public.current_user_id()
    )
  );

CREATE POLICY "Students can view their submissions"
  ON public.submissions FOR SELECT
  USING (
    student_id IN (
      SELECT student_id FROM public.students 
      WHERE user_id = public.current_user_id()
    )
    OR public.has_role(public.current_user_id(), 'teacher')
    OR public.has_role(public.current_user_id(), 'admin')
  );

CREATE POLICY "Teachers can grade submissions"
  ON public.submissions FOR UPDATE
  USING (
    public.has_role(public.current_user_id(), 'teacher') OR 
    public.has_role(public.current_user_id(), 'admin')
  );

-- EXAM RESULTS - Restricted access
DROP POLICY IF EXISTS "Exam results viewable by school members" ON public.exam_results;
CREATE POLICY "Restricted exam results access"
  ON public.exam_results FOR SELECT
  USING (
    public.has_role(public.current_user_id(), 'admin')
    OR (
      public.has_role(public.current_user_id(), 'student')
      AND student_id IN (
        SELECT student_id FROM public.students 
        WHERE user_id = public.current_user_id()
      )
    )
    OR (
      public.has_role(public.current_user_id(), 'parent')
      AND student_id IN (
        SELECT student_id FROM public.students 
        WHERE parent_id IN (
          SELECT parent_id FROM public.parents 
          WHERE user_id = public.current_user_id()
        )
      )
    )
    OR (
      public.has_role(public.current_user_id(), 'teacher')
      AND subject_id IN (
        SELECT subject_id FROM public.subjects 
        WHERE teacher_id IN (
          SELECT teacher_id FROM public.teachers 
          WHERE user_id = public.current_user_id()
        )
      )
    )
  );

-- FEES - Restricted access
DROP POLICY IF EXISTS "Fees viewable by school members" ON public.fees;
CREATE POLICY "Restricted fees access"
  ON public.fees FOR SELECT
  USING (
    public.has_role(public.current_user_id(), 'admin')
    OR (
      public.has_role(public.current_user_id(), 'student')
      AND student_id IN (
        SELECT student_id FROM public.students 
        WHERE user_id = public.current_user_id()
      )
    )
    OR (
      public.has_role(public.current_user_id(), 'parent')
      AND student_id IN (
        SELECT student_id FROM public.students 
        WHERE parent_id IN (
          SELECT parent_id FROM public.parents 
          WHERE user_id = public.current_user_id()
        )
      )
    )
  );

CREATE POLICY "Admins can manage fees"
  ON public.fees FOR ALL
  USING (
    public.has_role(public.current_user_id(), 'admin')
    AND school_id = public.current_school_id()
  );

-- SCHOOLS TABLE - Secure access
DROP POLICY IF EXISTS "Schools are viewable by their members" ON public.schools;
CREATE POLICY "Schools viewable by authenticated members"
  ON public.schools FOR SELECT
  USING (school_id = public.current_school_id());

CREATE POLICY "Admins can update their school"
  ON public.schools FOR UPDATE
  USING (
    public.has_role(public.current_user_id(), 'admin')
    AND school_id = public.current_school_id()
  );

-- MESSAGES - Users can message within school
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = public.current_user_id()
    AND school_id = public.current_school_id()
  );

CREATE POLICY "Users can update their sent messages"
  ON public.messages FOR UPDATE
  USING (sender_id = public.current_user_id());

-- NOTIFICATIONS - Admins and teachers can create
CREATE POLICY "Staff can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (
    (public.has_role(public.current_user_id(), 'admin') OR 
     public.has_role(public.current_user_id(), 'teacher'))
    AND school_id = public.current_school_id()
  );

-- EVENTS - Admins can manage
CREATE POLICY "Admins can manage events"
  ON public.events FOR ALL
  USING (
    public.has_role(public.current_user_id(), 'admin')
    AND school_id = public.current_school_id()
  );

-- CLASSES - Admins can manage
CREATE POLICY "Admins can manage classes"
  ON public.classes FOR ALL
  USING (
    public.has_role(public.current_user_id(), 'admin')
    AND school_id = public.current_school_id()
  );

-- SUBJECTS - Admins can manage
CREATE POLICY "Admins can manage subjects"
  ON public.subjects FOR ALL
  USING (
    public.has_role(public.current_user_id(), 'admin')
    AND class_id IN (
      SELECT class_id FROM public.classes 
      WHERE school_id = public.current_school_id()
    )
  );

-- TIMETABLE - Teachers and admins can manage
CREATE POLICY "Staff can manage timetable"
  ON public.timetable FOR ALL
  USING (
    (public.has_role(public.current_user_id(), 'admin') OR 
     public.has_role(public.current_user_id(), 'teacher'))
    AND class_id IN (
      SELECT class_id FROM public.classes 
      WHERE school_id = public.current_school_id()
    )
  );

-- EXAMS - Admins can manage
CREATE POLICY "Admins can manage exams"
  ON public.exams FOR ALL
  USING (
    public.has_role(public.current_user_id(), 'admin')
    AND school_id = public.current_school_id()
  );

-- LIBRARY - Admins can manage
CREATE POLICY "Admins can manage library books"
  ON public.library_books FOR ALL
  USING (
    public.has_role(public.current_user_id(), 'admin')
    AND school_id = public.current_school_id()
  );

CREATE POLICY "Staff can manage library issues"
  ON public.library_issues FOR ALL
  USING (
    public.has_role(public.current_user_id(), 'admin') OR 
    public.has_role(public.current_user_id(), 'teacher')
  );

-- INVENTORY - Admins can manage
CREATE POLICY "Admins can manage inventory"
  ON public.inventory FOR ALL
  USING (
    public.has_role(public.current_user_id(), 'admin')
    AND school_id = public.current_school_id()
  );

-- TRANSPORT - Admins can manage
CREATE POLICY "Admins can manage transport"
  ON public.transport FOR ALL
  USING (
    public.has_role(public.current_user_id(), 'admin')
    AND school_id = public.current_school_id()
  );

-- PAYROLL - Restricted access
DROP POLICY IF EXISTS "Payroll viewable by recipient teacher" ON public.payroll;
CREATE POLICY "Payroll restricted access"
  ON public.payroll FOR SELECT
  USING (
    public.has_role(public.current_user_id(), 'admin')
    OR teacher_id IN (
      SELECT teacher_id FROM public.teachers 
      WHERE user_id = public.current_user_id()
    )
  );

CREATE POLICY "Admins can manage payroll"
  ON public.payroll FOR ALL
  USING (public.has_role(public.current_user_id(), 'admin'));

-- AI TOOLS - Users can create and view their own
CREATE POLICY "Users can create AI tools"
  ON public.ai_tools FOR INSERT
  WITH CHECK (user_id = public.current_user_id());

CREATE POLICY "Users can update their AI tools"
  ON public.ai_tools FOR UPDATE
  USING (user_id = public.current_user_id());

-- EXAM TIMETABLE policies
CREATE POLICY "Admins can manage exam timetable"
  ON public.exam_timetable FOR ALL
  USING (
    public.has_role(public.current_user_id(), 'admin')
  );

-- PARENTS policies
CREATE POLICY "Admins can manage parents"
  ON public.parents FOR ALL
  USING (
    public.has_role(public.current_user_id(), 'admin')
    AND user_id IN (
      SELECT user_id FROM public.users 
      WHERE school_id = public.current_school_id()
    )
  );