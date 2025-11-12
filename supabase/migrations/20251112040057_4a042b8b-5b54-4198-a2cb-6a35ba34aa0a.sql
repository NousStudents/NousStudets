-- STEP 1: Add user info columns to role-specific tables

-- Add columns to teachers table
ALTER TABLE public.teachers
ADD COLUMN auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN full_name CHARACTER VARYING NOT NULL DEFAULT '',
ADD COLUMN email CHARACTER VARYING UNIQUE NOT NULL DEFAULT '',
ADD COLUMN phone CHARACTER VARYING,
ADD COLUMN status CHARACTER VARYING DEFAULT 'active',
ADD COLUMN profile_image TEXT;

-- Add columns to students table
ALTER TABLE public.students
ADD COLUMN auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN full_name CHARACTER VARYING NOT NULL DEFAULT '',
ADD COLUMN email CHARACTER VARYING UNIQUE NOT NULL DEFAULT '',
ADD COLUMN phone CHARACTER VARYING,
ADD COLUMN status CHARACTER VARYING DEFAULT 'active';

-- Add columns to parents table
ALTER TABLE public.parents
ADD COLUMN auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN school_id UUID NOT NULL REFERENCES public.schools(school_id),
ADD COLUMN full_name CHARACTER VARYING NOT NULL DEFAULT '',
ADD COLUMN email CHARACTER VARYING UNIQUE NOT NULL DEFAULT '',
ADD COLUMN phone CHARACTER VARYING,
ADD COLUMN status CHARACTER VARYING DEFAULT 'active',
ADD COLUMN profile_image TEXT;

-- Add columns to admins table
ALTER TABLE public.admins
ADD COLUMN auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN school_id UUID NOT NULL REFERENCES public.schools(school_id),
ADD COLUMN full_name CHARACTER VARYING NOT NULL DEFAULT '',
ADD COLUMN email CHARACTER VARYING UNIQUE NOT NULL DEFAULT '',
ADD COLUMN phone CHARACTER VARYING,
ADD COLUMN status CHARACTER VARYING DEFAULT 'active',
ADD COLUMN profile_image TEXT;

-- STEP 2: Migrate data from users table to role-specific tables
-- Update teachers
UPDATE public.teachers t
SET 
  auth_user_id = u.auth_user_id,
  full_name = u.full_name,
  email = u.email,
  phone = u.phone,
  status = u.status,
  profile_image = u.profile_image
FROM public.users u
WHERE t.user_id = u.user_id;

-- Update students
UPDATE public.students s
SET 
  auth_user_id = u.auth_user_id,
  full_name = u.full_name,
  email = u.email,
  phone = u.phone,
  status = u.status,
  profile_picture = u.profile_image
FROM public.users u
WHERE s.user_id = u.user_id;

-- Update parents
UPDATE public.parents p
SET 
  auth_user_id = u.auth_user_id,
  school_id = u.school_id,
  full_name = u.full_name,
  email = u.email,
  phone = u.phone,
  status = u.status,
  profile_image = u.profile_image
FROM public.users u
WHERE p.user_id = u.user_id;

-- Update admins
UPDATE public.admins a
SET 
  auth_user_id = u.auth_user_id,
  school_id = u.school_id,
  full_name = u.full_name,
  email = u.email,
  phone = u.phone,
  status = u.status,
  profile_image = u.profile_image
FROM public.users u
WHERE a.user_id = u.user_id;

-- STEP 3: Make auth_user_id NOT NULL after migration
ALTER TABLE public.teachers ALTER COLUMN auth_user_id SET NOT NULL;
ALTER TABLE public.students ALTER COLUMN auth_user_id SET NOT NULL;
ALTER TABLE public.parents ALTER COLUMN auth_user_id SET NOT NULL;
ALTER TABLE public.admins ALTER COLUMN auth_user_id SET NOT NULL;

-- Remove defaults now that data is migrated
ALTER TABLE public.teachers ALTER COLUMN full_name DROP DEFAULT;
ALTER TABLE public.students ALTER COLUMN full_name DROP DEFAULT;
ALTER TABLE public.parents ALTER COLUMN full_name DROP DEFAULT;
ALTER TABLE public.admins ALTER COLUMN full_name DROP DEFAULT;

ALTER TABLE public.teachers ALTER COLUMN email DROP DEFAULT;
ALTER TABLE public.students ALTER COLUMN email DROP DEFAULT;
ALTER TABLE public.parents ALTER COLUMN email DROP DEFAULT;
ALTER TABLE public.admins ALTER COLUMN email DROP DEFAULT;