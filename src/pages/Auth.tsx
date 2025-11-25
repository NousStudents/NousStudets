import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, GraduationCap, UserCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state for students
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [signupSchool, setSignupSchool] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  // Fetch schools for student signup
  const { data: schools } = useQuery({
    queryKey: ["schools"],
    queryFn: async () => {
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
    
    if (!loginRole) {
      return;
    }
    
    setLoginLoading(true);
    
    const { error } = await signIn(loginEmail, loginPassword, loginRole);
    
    setLoginLoading(false);
    
    if (!error) {
      navigate('/dashboard');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoginLoading(true);
    await signInWithGoogle();
    setLoginLoading(false);
  };

  const [signupRole, setSignupRole] = useState<'student' | 'teacher' | 'parent'>('student');

  const handleStudentSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupSchool) {
      toast.error("Please select your school");
      return;
    }

    setSignupLoading(true);

    try {
      const functionName = signupRole === 'student' ? 'student-signup' 
        : signupRole === 'teacher' ? 'teacher-signup' 
        : 'parent-signup';

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: {
          email: signupEmail,
          password: signupPassword,
          fullName: signupFullName,
          schoolId: signupSchool,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(data.message || "Account created successfully! You can now log in.");
      
      // Reset form
      setSignupEmail('');
      setSignupPassword('');
      setSignupFullName('');
      setSignupSchool('');
      
      // Auto-fill login email and role
      setLoginEmail(signupEmail);
      setLoginRole(signupRole);
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="hidden md:flex flex-col items-start space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary rounded-2xl">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold text-primary">
              Nous
            </h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-bold text-foreground">
              Modern School Management Platform
            </h2>
            <p className="text-lg text-muted-foreground">
              Streamline education with our comprehensive multi-tenant solution for schools, teachers, students, and parents.
            </p>
          </div>

          <div className="space-y-4 w-full">
            <div className="flex items-start gap-3 p-4 bg-card rounded-lg shadow-card">
              <BookOpen className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold text-foreground">Smart Learning Tools</h3>
                <p className="text-sm text-muted-foreground">AI-powered features for enhanced education</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-card rounded-lg shadow-card">
              <UserCircle className="h-6 w-6 text-secondary mt-1" />
              <div>
                <h3 className="font-semibold text-foreground">Role-Based Access</h3>
                <p className="text-sm text-muted-foreground">Secure, tenant-isolated data management</p>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Form */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Student Signup</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-role">User Type *</Label>
                    <Select 
                      value={loginRole} 
                      onValueChange={setLoginRole}
                      disabled={loginLoading}
                      required
                    >
                      <SelectTrigger id="login-role">
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
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <PasswordInput
                      id="login-password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      disabled={loginLoading}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={loginLoading || !loginRole}
                  >
                    {loginLoading ? 'Signing in...' : 'Sign In'}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleGoogleSignIn}
                    disabled={loginLoading}
                  >
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    {loginLoading ? 'Signing in...' : 'Sign in with Google'}
                  </Button>
                </form>
              </TabsContent>

              {/* Signup Tab with Role Selection */}
              <TabsContent value="signup">
                <div className="space-y-4 mt-4">
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Your email must be pre-registered by your school admin to sign up
                    </p>
                  </div>

                  <Tabs defaultValue="student" className="w-full" onValueChange={(value) => setSignupRole(value as 'student' | 'teacher' | 'parent')}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="student">Student</TabsTrigger>
                      <TabsTrigger value="teacher">Teacher</TabsTrigger>
                      <TabsTrigger value="parent">Parent</TabsTrigger>
                    </TabsList>

                    {/* Student Signup */}
                    <TabsContent value="student">
                      <form onSubmit={handleStudentSignup} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="student-school">Select Your School *</Label>
                          <Select 
                            value={signupSchool} 
                            onValueChange={setSignupSchool}
                            disabled={signupLoading}
                            required
                          >
                            <SelectTrigger id="student-school">
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
                          <Label htmlFor="student-name">Full Name *</Label>
                          <Input
                            id="student-name"
                            type="text"
                            placeholder="Your full name"
                            value={signupFullName}
                            onChange={(e) => setSignupFullName(e.target.value)}
                            required
                            disabled={signupLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="student-email">Email *</Label>
                          <Input
                            id="student-email"
                            type="email"
                            placeholder="your.email@school.com"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            required
                            disabled={signupLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="student-password">Password *</Label>
                          <PasswordInput
                            id="student-password"
                            placeholder="Create a strong password"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            required
                            disabled={signupLoading}
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={signupLoading}>
                          {signupLoading ? 'Creating Account...' : 'Create Student Account'}
                        </Button>
                      </form>
                    </TabsContent>

                    {/* Teacher Signup */}
                    <TabsContent value="teacher">
                      <form onSubmit={handleStudentSignup} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="teacher-school">Select Your School *</Label>
                          <Select 
                            value={signupSchool} 
                            onValueChange={setSignupSchool}
                            disabled={signupLoading}
                            required
                          >
                            <SelectTrigger id="teacher-school">
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
                          <Label htmlFor="teacher-name">Full Name *</Label>
                          <Input
                            id="teacher-name"
                            type="text"
                            placeholder="Your full name"
                            value={signupFullName}
                            onChange={(e) => setSignupFullName(e.target.value)}
                            required
                            disabled={signupLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="teacher-email">Email *</Label>
                          <Input
                            id="teacher-email"
                            type="email"
                            placeholder="your.email@school.com"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            required
                            disabled={signupLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="teacher-password">Password *</Label>
                          <PasswordInput
                            id="teacher-password"
                            placeholder="Create a strong password"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            required
                            disabled={signupLoading}
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={signupLoading}>
                          {signupLoading ? 'Creating Account...' : 'Create Teacher Account'}
                        </Button>
                      </form>
                    </TabsContent>

                    {/* Parent Signup */}
                    <TabsContent value="parent">
                      <form onSubmit={handleStudentSignup} className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="parent-school">Select Your School *</Label>
                          <Select 
                            value={signupSchool} 
                            onValueChange={setSignupSchool}
                            disabled={signupLoading}
                            required
                          >
                            <SelectTrigger id="parent-school">
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
                          <Label htmlFor="parent-name">Full Name *</Label>
                          <Input
                            id="parent-name"
                            type="text"
                            placeholder="Your full name"
                            value={signupFullName}
                            onChange={(e) => setSignupFullName(e.target.value)}
                            required
                            disabled={signupLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="parent-email">Email *</Label>
                          <Input
                            id="parent-email"
                            type="email"
                            placeholder="your.email@school.com"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            required
                            disabled={signupLoading}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="parent-password">Password *</Label>
                          <PasswordInput
                            id="parent-password"
                            placeholder="Create a strong password"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            required
                            disabled={signupLoading}
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={signupLoading}>
                          {signupLoading ? 'Creating Account...' : 'Create Parent Account'}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>

                  <div className="pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground text-center">
                      Admins: Contact super admin for account creation
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;