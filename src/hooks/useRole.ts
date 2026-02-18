import { useAuth } from '@/contexts/AuthContext';

export const useRole = () => {
  const { user, loading } = useAuth();

  const role = user?.role || null;
  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';
  const isStudent = role === 'student';
  const isParent = role === 'parent';

  return {
    role,
    isAdmin,
    isTeacher,
    isStudent,
    isParent,
    loading
  };
};

export default useRole;
