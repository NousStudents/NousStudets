-- Add comprehensive student profile fields to students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS admission_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10),
ADD COLUMN IF NOT EXISTS nationality VARCHAR(100) DEFAULT 'Indian',
ADD COLUMN IF NOT EXISTS mother_tongue VARCHAR(50),
ADD COLUMN IF NOT EXISTS religion VARCHAR(50),
ADD COLUMN IF NOT EXISTS student_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS student_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS door_no VARCHAR(50),
ADD COLUMN IF NOT EXISTS street VARCHAR(255),
ADD COLUMN IF NOT EXISTS village_town VARCHAR(100),
ADD COLUMN IF NOT EXISTS district VARCHAR(100),
ADD COLUMN IF NOT EXISTS academic_year VARCHAR(20),
ADD COLUMN IF NOT EXISTS previous_school VARCHAR(255),
ADD COLUMN IF NOT EXISTS date_of_admission DATE,
ADD COLUMN IF NOT EXISTS medium_of_instruction VARCHAR(50),
ADD COLUMN IF NOT EXISTS student_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS height DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS weight DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS medical_conditions TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS emergency_contact_relationship VARCHAR(100),
ADD COLUMN IF NOT EXISTS emergency_contact_mobile VARCHAR(20),
ADD COLUMN IF NOT EXISTS family_doctor_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS doctor_contact_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS hobbies TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT,
ADD COLUMN IF NOT EXISTS achievements TEXT,
ADD COLUMN IF NOT EXISTS languages_known TEXT,
ADD COLUMN IF NOT EXISTS father_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS father_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS father_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS father_occupation VARCHAR(255),
ADD COLUMN IF NOT EXISTS mother_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS mother_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS mother_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS mother_occupation VARCHAR(255),
ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS guardian_relationship VARCHAR(100),
ADD COLUMN IF NOT EXISTS guardian_contact VARCHAR(20),
ADD COLUMN IF NOT EXISTS birth_certificate_url TEXT,
ADD COLUMN IF NOT EXISTS transfer_certificate_url TEXT,
ADD COLUMN IF NOT EXISTS aadhar_card_url TEXT,
ADD COLUMN IF NOT EXISTS id_card_url TEXT,
ADD COLUMN IF NOT EXISTS report_cards_url TEXT,
ADD COLUMN IF NOT EXISTS other_documents_url TEXT,
ADD COLUMN IF NOT EXISTS profile_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create student_profile_history table for tracking changes
CREATE TABLE IF NOT EXISTS public.student_profile_history (
  history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(student_id) ON DELETE CASCADE,
  updated_by UUID NOT NULL,
  updated_by_role VARCHAR(50) NOT NULL,
  field_name VARCHAR(100) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on history table
ALTER TABLE public.student_profile_history ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to view history
CREATE POLICY "Admins can view student profile history"
ON public.student_profile_history
FOR SELECT
USING (
  has_role('admin')
);

-- Create policy for inserting history
CREATE POLICY "System can insert profile history"
ON public.student_profile_history
FOR INSERT
WITH CHECK (true);

-- Create storage bucket for student documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-documents', 'student-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for student documents
CREATE POLICY "Admins can upload student documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'student-documents' AND
  has_role('admin')
);

CREATE POLICY "Admins can view student documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'student-documents' AND
  has_role('admin')
);

CREATE POLICY "Students can view their own documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'student-documents' AND
  has_role('student') AND
  (storage.foldername(name))[1] = get_student_id()::text
);

CREATE POLICY "Parents can view their children's documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'student-documents' AND
  has_role('parent') AND
  (storage.foldername(name))[1] IN (
    SELECT student_id::text FROM students WHERE parent_id = get_parent_id()
  )
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_students_admission_number ON public.students(admission_number);
CREATE INDEX IF NOT EXISTS idx_students_blood_group ON public.students(blood_group);
CREATE INDEX IF NOT EXISTS idx_student_profile_history_student_id ON public.student_profile_history(student_id);

-- Add comment
COMMENT ON TABLE public.student_profile_history IS 'Tracks all changes made to student profiles for audit purposes';