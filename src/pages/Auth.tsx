import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GraduationCap, Check, X, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client'; // Keep for public list fetch only
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<string>('');
  const [loginSchool, setLoginSchool] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [signupSchool, setSignupSchool] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  const [passwordTouched, setPasswordTouched] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  });

  useEffect(() => {
    if (!passwordTouched) return;
    const password = activeTab === 'login' ? loginPassword : signupPassword;
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [loginPassword, signupPassword, activeTab, passwordTouched]);

  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handlePasswordChange = (value: string, isLogin: boolean) => {
    setPasswordTouched(true);
    if (isLogin) {
      setLoginPassword(value);
    } else {
      setSignupPassword(value);
    }
  };

  const { data: schools } = useQuery({
    queryKey: ["schools"],
    queryFn: async () => {
      // PROVISIONAL: Using Supabase client for public list until GET /schools is ready on NestJS
      const { data, error } = await supabase
        .from("schools")
        .select("school_id, school_name")
        .order("school_name");
      if (error) throw error;
      return data;
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginRole || !loginSchool) {
      toast.error('Please select both your role and school.');
      return;
    }
    setLoginLoading(true);
    // Updated to use the new signIn signature with schoolId
    const { error } = await signIn(loginEmail, loginPassword, loginRole, loginSchool);
    setLoginLoading(false);
    if (!error) {
      navigate('/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoginLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign-in error:', error);
    } finally {
      setLoginLoading(false);
    }
  };

  const [signupRole, setSignupRole] = useState<'student' | 'teacher' | 'parent'>('student');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupSchool) {
      toast.error("Please select your school");
      return;
    }
    setSignupLoading(true);
    try {
      // Updated to use authService.register instead of Supabase invoke
      await authService.register({
        email: signupEmail,
        password: signupPassword,
        fullName: signupFullName,
        role: signupRole,
        schoolId: signupSchool,
      });

      toast.success("Account created successfully! You can now log in.");

      // Auto-fill login fields
      setLoginEmail(signupEmail);
      setLoginRole(signupRole);
      setLoginSchool(signupSchool);

      // Reset signup fields
      setSignupEmail('');
      setSignupPassword('');
      setSignupFullName('');
      setSignupSchool('');

    } catch (error: any) {
      console.error('Signup error:', error);
      const message = error.response?.data?.message || error.message || "Failed to create account";
      toast.error(message);
    } finally {
      setSignupLoading(false);
    }
  };

  const ValidationRule = ({ label, isValid }: { label: string; isValid: boolean }) => (
    <div className={cn(
      "flex items-center gap-2 transition-colors duration-200",
      isValid ? "text-success" : "text-muted-foreground"
    )}>
      {isValid ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <X className="h-3.5 w-3.5" />
      )}
      <span className="text-xs">{label}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative z-10 animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-accent-purple to-accent-blue mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Nous</h1>
          <p className="text-muted-foreground mt-1">School Management Platform</p>
        </div>

        <Card className="border-border/50 shadow-xl bg-card/80 backdrop-blur-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Welcome</CardTitle>
            <CardDescription>Sign in to continue to your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full" onValueChange={(value) => {
              setActiveTab(value as 'login' | 'signup');
              setPasswordTouched(false);
            }}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-school">School</Label>
                    <Select
                      value={loginSchool}
                      onValueChange={setLoginSchool}
                      disabled={loginLoading}
                    >
                      <SelectTrigger id="login-school" className="h-12">
                        <SelectValue placeholder="Select your school" />
                      </SelectTrigger>
                      <SelectContent>
                        {schools?.map((school) => (
                          <SelectItem key={school.school_id} value={school.school_id}>
                            {school.school_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-role">I am a</Label>
                    <Select
                      value={loginRole}
                      onValueChange={setLoginRole}
                      disabled={loginLoading}
                    >
                      <SelectTrigger id="login-role" className="h-12">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@school.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                      disabled={loginLoading}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <PasswordInput
                      id="login-password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => handlePasswordChange(e.target.value, true)}
                      required
                      disabled={loginLoading}
                      className="h-12"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium"
                    disabled={loginLoading || !loginRole || !loginSchool}
                  >
                    {loginLoading ? 'Signing in...' : 'Sign In'}
                  </Button>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 gap-3"
                    onClick={handleGoogleSignIn}
                    disabled={loginLoading}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab */}
              <TabsContent value="signup">
                <div className="rounded-xl bg-secondary/50 p-3 mb-4 flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-accent-gold mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Your email must be pre-registered by your school admin to sign up
                  </p>
                </div>

                <Tabs defaultValue="student" className="w-full" onValueChange={(value) => setSignupRole(value as 'student' | 'teacher' | 'parent')}>
                  <TabsList className="grid w-full grid-cols-3 mb-4">
                    <TabsTrigger value="student" className="text-xs">Student</TabsTrigger>
                    <TabsTrigger value="teacher" className="text-xs">Teacher</TabsTrigger>
                    <TabsTrigger value="parent" className="text-xs">Parent</TabsTrigger>
                  </TabsList>

                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Your School</Label>
                      <Select value={signupSchool} onValueChange={setSignupSchool} disabled={signupLoading}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Choose your school" />
                        </SelectTrigger>
                        <SelectContent>
                          {schools?.map((school) => (
                            <SelectItem key={school.school_id} value={school.school_id}>
                              {school.school_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        type="text"
                        placeholder="Your full name"
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                        required
                        disabled={signupLoading}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="your.email@school.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                        disabled={signupLoading}
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Password</Label>
                      <PasswordInput
                        placeholder="Create a strong password"
                        value={signupPassword}
                        onChange={(e) => handlePasswordChange(e.target.value, false)}
                        required
                        disabled={signupLoading}
                        className="h-12"
                      />
                      {passwordTouched && (
                        <div className="mt-3 space-y-1.5 p-3 rounded-lg bg-secondary/50">
                          <ValidationRule label="At least 8 characters" isValid={passwordValidation.minLength} />
                          <ValidationRule label="One uppercase letter" isValid={passwordValidation.hasUppercase} />
                          <ValidationRule label="One lowercase letter" isValid={passwordValidation.hasLowercase} />
                          <ValidationRule label="One number" isValid={passwordValidation.hasNumber} />
                          <ValidationRule label="One special character" isValid={passwordValidation.hasSpecial} />
                        </div>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-medium"
                      disabled={signupLoading || (passwordTouched && !isPasswordValid)}
                    >
                      {signupLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Auth;
