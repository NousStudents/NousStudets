-- Add profile_image column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Update existing student profile pictures to users table
UPDATE public.users u
SET profile_image = s.profile_picture
FROM public.students s
WHERE u.user_id = s.user_id 
AND s.profile_picture IS NOT NULL 
AND u.profile_image IS NULL;