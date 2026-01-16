-- ================================================================
-- NOUS STUDENTS - COMPLETE DATABASE SCHEMA
-- Generated from Lovable Cloud (PostgreSQL/Supabase)
-- ================================================================

-- ================================================================
-- EXTENSIONS
-- ================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- TABLES
-- ================================================================

-- Schools (Core tenant table)
CREATE TABLE public.schools (
    school_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    school_name VARCHAR NOT NULL,
    address TEXT,
    city VARCHAR,
    state VARCHAR,
    phone VARCHAR,
    email VARCHAR,
    website VARCHAR,
    subdomain VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Super Admins (Platform-level administrators)
CREATE TABLE public.super_admins (
    super_admin_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID NOT NULL,
    email VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    status VARCHAR DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Admins (School-level administrators)
CREATE TABLE public.admins (
    admin_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    auth_user_id UUID NOT NULL,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    full_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR,
    department VARCHAR,
    admin_level VARCHAR,
    permissions JSONB DEFAULT '[]'::jsonb,
    status VARCHAR DEFAULT 'active',
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Teachers
CREATE TABLE public.teachers (
    teacher_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    auth_user_id UUID NOT NULL,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    full_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR,
    qualification VARCHAR,
    experience INTEGER,
    subject_specialization TEXT,
    status VARCHAR DEFAULT 'active',
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Classes
CREATE TABLE public.classes (
    class_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    class_name VARCHAR NOT NULL,
    section VARCHAR,
    class_teacher_id UUID REFERENCES public.teachers(teacher_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Students
CREATE TABLE public.students (
    student_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    auth_user_id UUID NOT NULL,
    class_id UUID REFERENCES public.classes(class_id),
    parent_id UUID,
    full_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR,
    roll_no VARCHAR,
    section VARCHAR,
    admission_number VARCHAR,
    dob DATE,
    gender VARCHAR,
    blood_group VARCHAR,
    nationality VARCHAR DEFAULT 'Indian',
    mother_tongue VARCHAR,
    religion VARCHAR,
    admission_date DATE,
    date_of_admission DATE,
    academic_year VARCHAR,
    previous_school VARCHAR,
    medium_of_instruction VARCHAR,
    student_category VARCHAR,
    district VARCHAR,
    door_no VARCHAR,
    street VARCHAR,
    village_town VARCHAR,
    student_phone VARCHAR,
    student_email VARCHAR,
    -- Health Information
    height NUMERIC,
    weight NUMERIC,
    allergies TEXT,
    medical_conditions TEXT,
    -- Emergency Contact
    emergency_contact_name VARCHAR,
    emergency_contact_relationship VARCHAR,
    emergency_contact_mobile VARCHAR,
    family_doctor_name VARCHAR,
    doctor_contact_number VARCHAR,
    -- Parent Information
    father_name VARCHAR,
    father_phone VARCHAR,
    father_email VARCHAR,
    father_occupation VARCHAR,
    mother_name VARCHAR,
    mother_phone VARCHAR,
    mother_email VARCHAR,
    mother_occupation VARCHAR,
    guardian_name VARCHAR,
    guardian_relationship VARCHAR,
    guardian_contact VARCHAR,
    -- Extra-curricular
    hobbies TEXT,
    interests TEXT,
    achievements TEXT,
    languages_known TEXT,
    -- Documents
    profile_picture TEXT,
    birth_certificate_url TEXT,
    transfer_certificate_url TEXT,
    aadhar_card_url TEXT,
    id_card_url TEXT,
    report_cards_url TEXT,
    other_documents_url TEXT,
    -- Metadata
    status VARCHAR DEFAULT 'active',
    profile_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Parents
CREATE TABLE public.parents (
    parent_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    auth_user_id UUID NOT NULL,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    full_name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    phone VARCHAR,
    relation VARCHAR,
    occupation VARCHAR,
    status VARCHAR DEFAULT 'active',
    profile_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add foreign key for students.parent_id
ALTER TABLE public.students ADD CONSTRAINT fk_students_parent 
    FOREIGN KEY (parent_id) REFERENCES public.parents(parent_id);

-- Users (General user reference table)
CREATE TABLE public.users (
    user_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID,
    school_id UUID REFERENCES public.schools(school_id),
    full_name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Subjects
CREATE TABLE public.subjects (
    subject_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(class_id),
    teacher_id UUID REFERENCES public.teachers(teacher_id),
    subject_name VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Timetable
CREATE TABLE public.timetable (
    timetable_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(class_id),
    subject_id UUID NOT NULL REFERENCES public.subjects(subject_id),
    teacher_id UUID REFERENCES public.teachers(teacher_id),
    day_of_week VARCHAR NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_no VARCHAR,
    period_type VARCHAR DEFAULT 'regular',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Period Types
CREATE TABLE public.period_types (
    period_type_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type_name TEXT NOT NULL,
    color_code TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Attendance
CREATE TABLE public.attendance (
    attendance_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(student_id),
    class_id UUID NOT NULL REFERENCES public.classes(class_id),
    date DATE NOT NULL,
    status VARCHAR,
    marked_by UUID REFERENCES public.teachers(teacher_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assignments
CREATE TABLE public.assignments (
    assignment_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(class_id),
    subject_id UUID NOT NULL REFERENCES public.subjects(subject_id),
    teacher_id UUID NOT NULL REFERENCES public.teachers(teacher_id),
    title VARCHAR NOT NULL,
    description TEXT,
    file_url TEXT,
    due_date DATE,
    max_marks NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Assignment Students (Many-to-Many relationship)
CREATE TABLE public.assignment_students (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES public.assignments(assignment_id),
    student_id UUID NOT NULL REFERENCES public.students(student_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Submissions
CREATE TABLE public.submissions (
    submission_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    assignment_id UUID NOT NULL REFERENCES public.assignments(assignment_id),
    student_id UUID NOT NULL REFERENCES public.students(student_id),
    submission_text TEXT,
    submission_file TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    marks_obtained NUMERIC,
    feedback TEXT,
    graded_at TIMESTAMP WITH TIME ZONE
);

-- Exams
CREATE TABLE public.exams (
    exam_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    class_id UUID NOT NULL REFERENCES public.classes(class_id),
    exam_name VARCHAR NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Exam Timetable
CREATE TABLE public.exam_timetable (
    timetable_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    exam_id UUID NOT NULL REFERENCES public.exams(exam_id),
    subject_id UUID NOT NULL REFERENCES public.subjects(subject_id),
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_no VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Exam Results
CREATE TABLE public.exam_results (
    result_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    exam_id UUID NOT NULL REFERENCES public.exams(exam_id),
    student_id UUID NOT NULL REFERENCES public.students(student_id),
    subject_id UUID NOT NULL REFERENCES public.subjects(subject_id),
    marks_obtained NUMERIC,
    max_marks NUMERIC,
    grade VARCHAR,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Fees
CREATE TABLE public.fees (
    fee_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(student_id),
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    amount NUMERIC NOT NULL,
    status VARCHAR DEFAULT 'pending',
    due_date DATE,
    payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Fee Predictions (AI)
CREATE TABLE public.fee_predictions (
    prediction_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    prediction_date DATE DEFAULT CURRENT_DATE,
    total_expected NUMERIC,
    total_collected NUMERIC,
    total_pending NUMERIC,
    predictions JSONB,
    unusual_activities JSONB,
    recommendations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payroll
CREATE TABLE public.payroll (
    payroll_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES public.teachers(teacher_id),
    month VARCHAR NOT NULL,
    amount NUMERIC NOT NULL,
    status VARCHAR DEFAULT 'pending',
    payment_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Library Books
CREATE TABLE public.library_books (
    book_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    title VARCHAR NOT NULL,
    author VARCHAR,
    isbn VARCHAR,
    quantity INTEGER DEFAULT 1,
    available INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Transport
CREATE TABLE public.transport (
    transport_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    route_name VARCHAR NOT NULL,
    driver_name VARCHAR,
    vehicle_no VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Inventory
CREATE TABLE public.inventory (
    item_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    item_name VARCHAR NOT NULL,
    quantity INTEGER DEFAULT 0,
    condition VARCHAR,
    purchase_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
    notification_id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR,
    status VARCHAR DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Smart Notifications
CREATE TABLE public.smart_notifications (
    notification_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    recipient_id UUID NOT NULL,
    recipient_type TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    priority TEXT DEFAULT 'medium',
    action_url TEXT,
    metadata JSONB,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Messages
CREATE TABLE public.messages (
    message_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    file_url TEXT,
    file_type TEXT,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    reply_to UUID,
    reactions JSONB DEFAULT '{}'::jsonb,
    read_by JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Conversations
CREATE TABLE public.conversations (
    conversation_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    is_group BOOLEAN DEFAULT false,
    group_name TEXT,
    group_description TEXT,
    group_image TEXT,
    created_by UUID,
    last_message_id UUID,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Conversation Participants
CREATE TABLE public.conversation_participants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(conversation_id),
    user_id UUID NOT NULL,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_read_at TIMESTAMP WITH TIME ZONE
);

-- Chat Requests
CREATE TABLE public.chat_requests (
    request_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Typing Indicators
CREATE TABLE public.typing_indicators (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL,
    is_typing BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Status
CREATE TABLE public.user_status (
    user_id UUID NOT NULL PRIMARY KEY,
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Meetings
CREATE TABLE public.meetings (
    meeting_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    organizer_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    meeting_url TEXT,
    meeting_type TEXT DEFAULT 'video',
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status TEXT DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Meeting Participants
CREATE TABLE public.meeting_participants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID NOT NULL REFERENCES public.meetings(meeting_id),
    user_id UUID NOT NULL,
    role TEXT DEFAULT 'participant',
    status TEXT DEFAULT 'invited',
    joined_at TIMESTAMP WITH TIME ZONE
);

-- Leave Requests
CREATE TABLE public.leave_requests (
    request_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(student_id),
    class_id UUID NOT NULL REFERENCES public.classes(class_id),
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.teachers(teacher_id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Class Announcements
CREATE TABLE public.class_announcements (
    announcement_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    class_id UUID NOT NULL REFERENCES public.classes(class_id),
    teacher_id UUID NOT NULL REFERENCES public.teachers(teacher_id),
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Activities (Activity Log)
CREATE TABLE public.activities (
    activity_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    actor_id UUID,
    actor_name TEXT,
    actor_role TEXT,
    activity_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_user_id UUID,
    target_class_id UUID,
    target_subject_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Audit Logs
CREATE TABLE public.audit_logs (
    log_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    performed_by UUID NOT NULL,
    action VARCHAR NOT NULL,
    target_user_id UUID,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Student Profile History
CREATE TABLE public.student_profile_history (
    history_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(student_id),
    updated_by UUID NOT NULL,
    updated_by_role VARCHAR NOT NULL,
    field_name VARCHAR NOT NULL,
    old_value TEXT,
    new_value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================================================================
-- WHITELIST TABLES (Pre-registration)
-- ================================================================

-- Allowed Students (Whitelist)
CREATE TABLE public.allowed_students (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    class_id UUID REFERENCES public.classes(class_id),
    email VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    section VARCHAR,
    roll_no VARCHAR,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Whitelisted Teachers
CREATE TABLE public.whitelisted_teachers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    email VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    department VARCHAR,
    subject_specialization TEXT,
    employee_id VARCHAR,
    phone VARCHAR,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Whitelisted Parents
CREATE TABLE public.whitelisted_parents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    email VARCHAR NOT NULL,
    full_name VARCHAR NOT NULL,
    phone VARCHAR,
    relation VARCHAR,
    student_ids UUID[] NOT NULL,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================================================================
-- AI TABLES
-- ================================================================

-- AI Lesson Plans
CREATE TABLE public.ai_lesson_plans (
    plan_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES public.teachers(teacher_id),
    subject_id UUID REFERENCES public.subjects(subject_id),
    class_id UUID REFERENCES public.classes(class_id),
    topic TEXT NOT NULL,
    grade_level TEXT,
    duration_minutes INTEGER,
    lesson_content JSONB NOT NULL,
    teaching_steps JSONB,
    activities JSONB,
    learning_outcomes JSONB,
    examples JSONB,
    resources TEXT[],
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Generated Assignments
CREATE TABLE public.ai_generated_assignments (
    generated_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES public.teachers(teacher_id),
    subject_id UUID REFERENCES public.subjects(subject_id),
    class_id UUID REFERENCES public.classes(class_id),
    assignment_type TEXT NOT NULL,
    topic TEXT NOT NULL,
    difficulty_level TEXT,
    questions JSONB NOT NULL,
    answer_key JSONB,
    max_marks INTEGER,
    auto_gradable BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Report Comments
CREATE TABLE public.ai_report_comments (
    comment_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Attendance Analysis
CREATE TABLE public.ai_attendance_analysis (
    analysis_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES public.teachers(teacher_id),
    class_id UUID NOT NULL REFERENCES public.classes(class_id),
    analysis_date DATE DEFAULT CURRENT_DATE,
    insights TEXT,
    recommendations TEXT,
    frequent_absentees JSONB,
    predicted_dropouts JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Performance Predictions
CREATE TABLE public.ai_performance_predictions (
    prediction_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(student_id),
    prediction_date DATE DEFAULT CURRENT_DATE,
    overall_risk_level TEXT,
    attendance_score NUMERIC,
    marks_score NUMERIC,
    assignment_score NUMERIC,
    behavior_score NUMERIC,
    weak_subjects JSONB,
    recommendations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Learning Paths
CREATE TABLE public.ai_learning_paths (
    path_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(student_id),
    subject_id UUID REFERENCES public.subjects(subject_id),
    current_level TEXT,
    target_level TEXT,
    milestones JSONB,
    progress_percentage NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Study Sessions
CREATE TABLE public.ai_study_sessions (
    session_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(student_id),
    subject_id UUID REFERENCES public.subjects(subject_id),
    session_type TEXT NOT NULL,
    input_content TEXT,
    ai_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Homework Help
CREATE TABLE public.ai_homework_help (
    help_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES public.students(student_id),
    subject_id UUID REFERENCES public.subjects(subject_id),
    help_type TEXT NOT NULL,
    homework_content TEXT,
    ai_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AI Chatbot Conversations
CREATE TABLE public.ai_chatbot_conversations (
    conversation_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    user_id UUID NOT NULL,
    user_type TEXT NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Admin AI Insights
CREATE TABLE public.admin_ai_insights (
    insight_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    insight_type TEXT NOT NULL,
    insight_data JSONB NOT NULL,
    predictions JSONB,
    recommendations TEXT,
    generated_by UUID,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Teacher Performance Metrics
CREATE TABLE public.teacher_performance_metrics (
    metric_id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID NOT NULL REFERENCES public.teachers(teacher_id),
    school_id UUID NOT NULL REFERENCES public.schools(school_id),
    metrics JSONB NOT NULL,
    strengths JSONB,
    improvement_areas JSONB,
    evaluation_date DATE DEFAULT CURRENT_DATE,
    recommendations TEXT,
    overall_score NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ================================================================
-- DATABASE FUNCTIONS
-- ================================================================

-- Get User Role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE
      WHEN EXISTS (SELECT 1 FROM public.admins WHERE auth_user_id = auth.uid()) THEN 'admin'
      WHEN EXISTS (SELECT 1 FROM public.teachers WHERE auth_user_id = auth.uid()) THEN 'teacher'
      WHEN EXISTS (SELECT 1 FROM public.students WHERE auth_user_id = auth.uid()) THEN 'student'
      WHEN EXISTS (SELECT 1 FROM public.parents WHERE auth_user_id = auth.uid()) THEN 'parent'
      ELSE NULL
    END;
$$;

-- Has Role Check
CREATE OR REPLACE FUNCTION public.has_role(_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    CASE _role
      WHEN 'admin' THEN EXISTS (SELECT 1 FROM public.admins WHERE auth_user_id = auth.uid())
      WHEN 'teacher' THEN EXISTS (SELECT 1 FROM public.teachers WHERE auth_user_id = auth.uid())
      WHEN 'student' THEN EXISTS (SELECT 1 FROM public.students WHERE auth_user_id = auth.uid())
      WHEN 'parent' THEN EXISTS (SELECT 1 FROM public.parents WHERE auth_user_id = auth.uid())
      ELSE FALSE
    END;
$$;

-- Is Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.super_admins
    WHERE auth_user_id = auth.uid()
    AND status = 'active'
  )
$$;

-- Get Current School ID
CREATE OR REPLACE FUNCTION public.current_school_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    COALESCE(
      (SELECT school_id FROM public.admins WHERE auth_user_id = auth.uid()),
      (SELECT school_id FROM public.teachers WHERE auth_user_id = auth.uid()),
      (SELECT c.school_id FROM public.students s JOIN public.classes c ON s.class_id = c.class_id WHERE s.auth_user_id = auth.uid()),
      (SELECT school_id FROM public.parents WHERE auth_user_id = auth.uid())
    );
$$;

-- Get Admin ID
CREATE OR REPLACE FUNCTION public.get_admin_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT admin_id FROM public.admins WHERE auth_user_id = auth.uid();
$$;

-- Get Teacher ID
CREATE OR REPLACE FUNCTION public.get_teacher_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT teacher_id FROM public.teachers WHERE auth_user_id = auth.uid();
$$;

-- Get Student ID
CREATE OR REPLACE FUNCTION public.get_student_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT student_id FROM public.students WHERE auth_user_id = auth.uid();
$$;

-- Get Parent ID
CREATE OR REPLACE FUNCTION public.get_parent_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT parent_id FROM public.parents WHERE auth_user_id = auth.uid();
$$;

-- Get Student Class ID
CREATE OR REPLACE FUNCTION public.get_student_class_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT class_id FROM students WHERE auth_user_id = auth.uid();
$$;

-- Get Teacher School ID
CREATE OR REPLACE FUNCTION public.get_teacher_school_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT school_id FROM public.teachers WHERE auth_user_id = auth.uid();
$$;

-- Get Teacher Class IDs
CREATE OR REPLACE FUNCTION public.get_teacher_class_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT c.class_id
  FROM classes c
  WHERE c.class_teacher_id = (SELECT teacher_id FROM teachers WHERE auth_user_id = auth.uid())
  UNION
  SELECT DISTINCT t.class_id
  FROM timetable t
  WHERE t.teacher_id = (SELECT teacher_id FROM teachers WHERE auth_user_id = auth.uid())
  UNION
  SELECT DISTINCT s.class_id
  FROM subjects s
  WHERE s.teacher_id = (SELECT teacher_id FROM teachers WHERE auth_user_id = auth.uid());
$$;

-- Get Teacher Class IDs for Students
CREATE OR REPLACE FUNCTION public.get_teacher_class_ids_for_students()
RETURNS SETOF UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT class_id FROM timetable WHERE teacher_id = get_teacher_id()
  UNION
  SELECT DISTINCT class_id FROM subjects WHERE teacher_id = get_teacher_id()
  UNION
  SELECT DISTINCT class_id FROM classes WHERE class_teacher_id = get_teacher_id();
$$;

-- Get Teacher Assignment IDs
CREATE OR REPLACE FUNCTION public.get_teacher_assignment_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT assignment_id FROM assignments WHERE teacher_id = get_teacher_id();
$$;

-- Get Student Assigned Assignment IDs
CREATE OR REPLACE FUNCTION public.get_student_assigned_assignment_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT assignment_id FROM assignment_students WHERE student_id = get_student_id();
$$;

-- Get Parent Children Class IDs
CREATE OR REPLACE FUNCTION public.get_parent_children_class_ids()
RETURNS SETOF UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT class_id 
  FROM students 
  WHERE parent_id = get_parent_id() 
  AND class_id IS NOT NULL;
$$;

-- Get User Role for Auth
CREATE OR REPLACE FUNCTION public.get_user_role_for_auth(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_role TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM public.super_admins WHERE auth_user_id = user_id AND status = 'active') THEN
    RETURN 'super_admin';
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.admins WHERE auth_user_id = user_id) THEN
    RETURN 'admin';
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.teachers WHERE auth_user_id = user_id) THEN
    RETURN 'teacher';
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.students WHERE auth_user_id = user_id) THEN
    RETURN 'student';
  END IF;
  
  IF EXISTS (SELECT 1 FROM public.parents WHERE auth_user_id = user_id) THEN
    RETURN 'parent';
  END IF;
  
  RETURN NULL;
END;
$$;

-- Handle Updated At Trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Validate Class Teacher Tenant
CREATE OR REPLACE FUNCTION public.validate_class_teacher_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.class_teacher_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.teachers
      WHERE teacher_id = NEW.class_teacher_id
      AND school_id = NEW.school_id
    ) THEN
      RAISE EXCEPTION 'Teacher does not belong to the same school as the class';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Cleanup Old Typing Indicators
CREATE OR REPLACE FUNCTION public.cleanup_old_typing_indicators()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.typing_indicators
  WHERE updated_at < now() - interval '10 seconds';
  RETURN NEW;
END;
$$;

-- Execute SQL Query (Admin only)
CREATE OR REPLACE FUNCTION public.execute_sql_query(query_text TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
  is_admin_user BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE auth_user_id = auth.uid()
  ) OR is_super_admin() INTO is_admin_user;
  
  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'Only administrators can execute SQL queries';
  END IF;
  
  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', query_text) INTO result;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- ================================================================
-- STORAGE BUCKETS
-- ================================================================

-- Profile Images (Public)
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true);

-- Message Files (Private)
INSERT INTO storage.buckets (id, name, public) VALUES ('message-files', 'message-files', false);

-- Assignment Files (Private)
INSERT INTO storage.buckets (id, name, public) VALUES ('assignment-files', 'assignment-files', false);

-- Student Documents (Private)
INSERT INTO storage.buckets (id, name, public) VALUES ('student-documents', 'student-documents', false);

-- ================================================================
-- END OF SCHEMA
-- ================================================================
