import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, selectedRole: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string, selectedRole: string) => {
    try {
      // First authenticate
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (authError) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: authError.message,
        });
        return { error: authError };
      }

      // Verify role matches by checking all role tables simultaneously
      if (authData.user) {
        // Check all role tables in parallel for better performance
        const [adminResult, teacherResult, studentResult, parentResult] = await Promise.all([
          supabase.from('admins').select('admin_id').eq('auth_user_id', authData.user.id).maybeSingle(),
          supabase.from('teachers').select('teacher_id').eq('auth_user_id', authData.user.id).maybeSingle(),
          supabase.from('students').select('student_id').eq('auth_user_id', authData.user.id).maybeSingle(),
          supabase.from('parents').select('parent_id').eq('auth_user_id', authData.user.id).maybeSingle(),
        ]);

        let actualRole: string | null = null;
        
        if (adminResult.data) actualRole = 'admin';
        else if (teacherResult.data) actualRole = 'teacher';
        else if (studentResult.data) actualRole = 'student';
        else if (parentResult.data) actualRole = 'parent';

        // Log for debugging
        console.log('Role check results:', {
          userId: authData.user.id,
          email: authData.user.email,
          selectedRole,
          actualRole,
          hasAdmin: !!adminResult.data,
          hasTeacher: !!teacherResult.data,
          hasStudent: !!studentResult.data,
          hasParent: !!parentResult.data,
        });

        if (!actualRole) {
          await supabase.auth.signOut();
          toast({
            title: "Role Not Found",
            description: "We couldn't verify your role. Please try again or contact admin.",
          });
          return { error: new Error('Unable to verify user role. Please contact administration.') };
        }

        if (actualRole !== selectedRole) {
          await supabase.auth.signOut();
          toast({
            title: "Role Mismatch",
            description: `Your account is registered as ${actualRole}, not ${selectedRole}.`,
          });
          return { error: new Error(`Your account is registered as ${actualRole}, not ${selectedRole}.`) };
        }
      }
      
      return { error: null };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
      return { error };
    }
  };


  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message,
        });
        return { error };
      }
      
      return { error: null };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
      return { error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
