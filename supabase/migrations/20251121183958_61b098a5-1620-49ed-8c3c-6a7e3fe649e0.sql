-- Create a security definer function to get user role during authentication
-- This bypasses RLS policies which would otherwise block role verification during login
CREATE OR REPLACE FUNCTION public.get_user_role_for_auth(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Check admin
  IF EXISTS (SELECT 1 FROM public.admins WHERE auth_user_id = user_id) THEN
    RETURN 'admin';
  END IF;
  
  -- Check teacher
  IF EXISTS (SELECT 1 FROM public.teachers WHERE auth_user_id = user_id) THEN
    RETURN 'teacher';
  END IF;
  
  -- Check student
  IF EXISTS (SELECT 1 FROM public.students WHERE auth_user_id = user_id) THEN
    RETURN 'student';
  END IF;
  
  -- Check parent
  IF EXISTS (SELECT 1 FROM public.parents WHERE auth_user_id = user_id) THEN
    RETURN 'parent';
  END IF;
  
  -- No role found
  RETURN NULL;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_role_for_auth(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role_for_auth(uuid) TO anon;