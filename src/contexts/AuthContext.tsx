import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserProfile, authService } from '@/services/auth.service';
import { toast } from 'sonner';

interface AuthContextType {
  user: UserProfile | null;
  // Temporary session object for backwards compatibility
  session: { user: { id: string; email: string } } | null;
  loading: boolean;
  signIn: (email: string, password: string, role: string, schoolId: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>; // Stub
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const userProfile = await authService.getProfile();
      setUser(userProfile);
    } catch (error) {
      console.error('Auth check failed:', error);
      // If profile fetch fails (e.g. 401), clear session
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const signIn = async (email: string, password: string, role: string, schoolId: string) => {
    try {
      const data = await authService.login({ email, password, role, schoolId });

      // Store tokens
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      // Fetch full profile immediately after login to populate state
      await checkAuth();

      return { error: null };
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      return { error: { message } };
    }
  };

  const signInWithGoogle = async () => {
    toast.info("Google Sign-In is temporarily disabled during system migration.");
    return { error: { message: "Google Sign-In implementation pending." } };
  };

  const signOut = async () => {
    try {
      // Attempt backend logout
      const token = localStorage.getItem('accessToken');
      if (token) {
        await authService.logout().catch(err => console.warn('Logout hook failed', err));
      }
    } finally {
      // Always cleanup local state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  // Provide compatibility for existing components expecting Supabase-like 'session'
  // TODO: Remove this once all components are refactored
  const session = user ? { user: { id: user.userId, email: user.email } } : null;

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signInWithGoogle, signOut, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
