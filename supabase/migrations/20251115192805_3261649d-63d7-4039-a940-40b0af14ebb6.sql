-- Create a function to execute dynamic SQL queries (admin only)
-- This function should only be used by authenticated admins
CREATE OR REPLACE FUNCTION public.execute_sql_query(query_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  is_admin_user boolean;
BEGIN
  -- Check if the user is an admin or super admin
  SELECT EXISTS (
    SELECT 1 FROM public.admins WHERE auth_user_id = auth.uid()
  ) OR is_super_admin() INTO is_admin_user;
  
  IF NOT is_admin_user THEN
    RAISE EXCEPTION 'Only administrators can execute SQL queries';
  END IF;
  
  -- Execute the query and return results as JSON
  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', query_text) INTO result;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- Grant execute permission to authenticated users (function handles authorization)
GRANT EXECUTE ON FUNCTION public.execute_sql_query(text) TO authenticated;