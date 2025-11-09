import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string, selectedRole: string) => Promise<{ error: any }>;
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

      // Verify role matches
      if (authData.user) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('auth_user_id', authData.user.id)
          .single();

        if (userError || !userData) {
          await supabase.auth.signOut();
          const error = new Error('Unable to verify user role. Please contact administration.');
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: error.message,
          });
          return { error };
        }

        if (userData.role !== selectedRole) {
          await supabase.auth.signOut();
          const error = new Error(`Your account is registered as ${userData.role}, not ${selectedRole}.`);
          toast({
            variant: "destructive",
            title: "Role Mismatch",
            description: error.message,
          });
          return { error };
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


  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
