-- First, let's create a user record for any auth users that don't have a public.users entry
-- This ensures existing admin accounts work properly

-- Insert missing user records for authenticated users who don't have public.users entries
-- Note: This is a one-time fix. New users should always be created via the admin-create-user function
INSERT INTO public.users (auth_user_id, email, full_name, role, school_id, status)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  COALESCE((au.raw_user_meta_data->>'role')::character varying, 'admin'),
  (SELECT school_id FROM public.schools LIMIT 1), -- Assign to first school; admin should update if needed
  'active'
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_user_id = au.id
WHERE pu.user_id IS NULL
  AND au.email IS NOT NULL;

-- Create a trigger to automatically create public.users entry when auth user is created
-- This prevents future issues with missing user records
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_school_id uuid;
BEGIN
  -- Get the first school (or you could make this configurable)
  SELECT school_id INTO default_school_id FROM public.schools LIMIT 1;
  
  -- Only create if not already exists (edge function should handle normal creation)
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = NEW.id) THEN
    INSERT INTO public.users (
      auth_user_id,
      email,
      full_name,
      role,
      school_id,
      status
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      COALESCE((NEW.raw_user_meta_data->>'role')::character varying, 'admin'),
      default_school_id,
      'active'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();