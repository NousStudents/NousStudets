-- Fix circular dependency in super_admins RLS policies
-- The issue: select_all_super_admin_records calls is_super_admin() which queries super_admins again
-- Solution: Remove the recursive policy, only keep the simple one for users to view their own record

DROP POLICY IF EXISTS "select_all_super_admin_records" ON public.super_admins;

-- The select_own_super_admin_record policy is sufficient for login
-- It allows authenticated users to check if they have a super admin record
-- No recursion, no circular dependency