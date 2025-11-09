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
        // Get user_id from users table
        const { data: userData } = await supabase
          .from('users')
          .select('user_id')
          .eq('auth_user_id', user.id)
          .single();

        if (userData) {
          // Fetch role from user_roles table (secure approach)
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userData.user_id)
            .single();

          setRole(roleData?.role || null);
        }
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
