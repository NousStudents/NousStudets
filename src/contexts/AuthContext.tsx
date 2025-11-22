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

      // Check if email is verified
      if (authData.user && !authData.user.email_confirmed_at) {
        await supabase.auth.signOut();
        toast({
          variant: "destructive",
          title: "Email Not Verified",
          description: "Please verify your email address before logging in. Check your inbox for the confirmation link.",
        });
        return { error: new Error('Email not verified') };
      }

      // Verify role matches using a secure database function that bypasses RLS
      if (authData.user) {
        // Use the secure function to get user role
        const { data: actualRole, error: roleError } = await supabase.rpc(
          'get_user_role_for_auth',
          { user_id: authData.user.id }
        );

        console.log('Role verification:', {
          userId: authData.user.id,
          email: authData.user.email,
          selectedRole,
          actualRole,
          roleError,
        });

        if (roleError || !actualRole) {
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
