-- STEP 10: Remove user_id foreign keys from role tables
ALTER TABLE public.teachers DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE public.students DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE public.parents DROP COLUMN IF EXISTS user_id CASCADE;
ALTER TABLE public.admins DROP COLUMN IF EXISTS user_id CASCADE;

-- STEP 11: Drop users and user_roles tables
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- STEP 12: Update or remove the handle_new_auth_user trigger function
-- Since we no longer have a users table, we can either drop this or repurpose it
-- For now, let's drop it since user creation will be handled by the edge function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_auth_user() CASCADE;