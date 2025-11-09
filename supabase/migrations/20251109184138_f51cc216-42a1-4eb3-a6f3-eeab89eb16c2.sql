
-- =============================================
-- FIX: Add school_id and constraints to teachers
-- =============================================

-- Step 1: Add school_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'teachers' 
    AND column_name = 'school_id'
  ) THEN
    ALTER TABLE public.teachers ADD COLUMN school_id uuid;
  END IF;
END $$;

-- Step 2: Populate school_id for existing teachers
UPDATE public.teachers t
SET school_id = u.school_id
FROM public.users u
WHERE t.user_id = u.user_id
AND t.school_id IS NULL;

-- Step 3: Make school_id NOT NULL
ALTER TABLE public.teachers
ALTER COLUMN school_id SET NOT NULL;

-- Step 4: Add foreign key constraints (if they don't exist)
DO $$
BEGIN
  -- Check and add teachers_school_id_fkey
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'teachers_school_id_fkey'
    AND table_name = 'teachers'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.teachers
    ADD CONSTRAINT teachers_school_id_fkey 
    FOREIGN KEY (school_id) REFERENCES public.schools(school_id) ON DELETE CASCADE;
  END IF;

  -- Check and add classes_class_teacher_id_fkey
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'classes_class_teacher_id_fkey'
    AND table_name = 'classes'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.classes
    ADD CONSTRAINT classes_class_teacher_id_fkey 
    FOREIGN KEY (class_teacher_id) REFERENCES public.teachers(teacher_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Step 5: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_teachers_school_id ON public.teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON public.teachers(user_id);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_class_teacher_id ON public.classes(class_teacher_id);
CREATE INDEX IF NOT EXISTS idx_users_school_id ON public.users(school_id);

-- Step 6: Update RLS policies for teachers table
DROP POLICY IF EXISTS "Teachers viewable by school members" ON public.teachers;
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;

CREATE POLICY "Teachers viewable by school members"
ON public.teachers
FOR SELECT
USING (school_id = current_school_id());

CREATE POLICY "Admins can manage teachers"
ON public.teachers
FOR ALL
USING (
  has_role(current_user_id(), 'admin'::app_role) 
  AND school_id = current_school_id()
)
WITH CHECK (
  has_role(current_user_id(), 'admin'::app_role) 
  AND school_id = current_school_id()
);

-- Step 7: Add subject_specialization column for teachers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'teachers' 
    AND column_name = 'subject_specialization'
  ) THEN
    ALTER TABLE public.teachers ADD COLUMN subject_specialization text;
  END IF;
END $$;

-- Step 8: Add helper function to get teacher's school_id
CREATE OR REPLACE FUNCTION public.get_teacher_school_id(_teacher_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM public.teachers WHERE teacher_id = _teacher_id;
$$;

-- Step 9: Add validation to prevent cross-tenant teacher assignments
CREATE OR REPLACE FUNCTION public.validate_class_teacher_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

DROP TRIGGER IF EXISTS validate_class_teacher_tenant_trigger ON public.classes;
CREATE TRIGGER validate_class_teacher_tenant_trigger
BEFORE INSERT OR UPDATE ON public.classes
FOR EACH ROW
EXECUTE FUNCTION public.validate_class_teacher_tenant();
