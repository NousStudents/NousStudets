import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // Use the server-side function to get role (bypasses RLS)
        const { data: roleData, error: roleError } = await supabase
          .rpc('get_user_role_for_auth', { user_id: user.id });

        if (roleError) {
          console.error('Error fetching role via RPC:', roleError);
        }

        if (roleData) {
          console.log('Role from RPC:', roleData);
          setRole(roleData);
          setLoading(false);
          return;
        }

        // Fallback: Check each role-specific table to determine user's role
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('admin_id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        console.log('Admin check:', { adminData, adminError });

        if (adminData) {
          setRole('admin');
          setLoading(false);
          return;
        }

        const { data: teacherData } = await supabase
          .from('teachers')
          .select('teacher_id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (teacherData) {
          setRole('teacher');
          setLoading(false);
          return;
        }

        const { data: studentData } = await supabase
          .from('students')
          .select('student_id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (studentData) {
          setRole('student');
          setLoading(false);
          return;
        }

        const { data: parentData } = await supabase
          .from('parents')
          .select('parent_id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (parentData) {
          setRole('parent');
          setLoading(false);
          return;
        }

        // No role found
        setRole(null);
      } catch (error) {
        console.error('Error fetching role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user]);

  const isAdmin = role === "admin";
  const isTeacher = role === "teacher";
  const isStudent = role === "student";
  const isParent = role === "parent";

  return { role, isAdmin, isTeacher, isStudent, isParent, loading };
};

// Export as default as well for compatibility
export default useRole;
