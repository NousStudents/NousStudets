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
        console.log('Auth state change:', event, session?.user?.email);
        
        // Update session state immediately
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle sign-in events (including OAuth) - defer Supabase calls
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            // Verify user has a valid role in the system
            const { data: userRole, error: roleError } = await supabase.rpc(
              'get_user_role_for_auth',
              { user_id: session.user.id }
            );

            console.log('Role verification:', { userRole, roleError });

            // If no role found, user is not registered in the system
            if (roleError || !userRole) {
              console.log('No role found, signing out');
              await supabase.auth.signOut();
              
              toast({
                variant: "destructive",
                title: "Access Denied",
                description: "You are not registered in the NousStudents system. Contact your school admin.",
              });
              
              setSession(null);
              setUser(null);
            } else {
              console.log('User authenticated successfully with role:', userRole);
            }
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

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
      console.log('Initiating Google OAuth...');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        console.error('Google OAuth error:', error);
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error.message,
        });
        return { error };
      }
      
      // OAuth redirect will happen, verification occurs in onAuthStateChange
      return { error: null };
    } catch (error: any) {
      console.error('Google sign-in error:', error);
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
