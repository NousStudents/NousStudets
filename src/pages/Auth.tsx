import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, GraduationCap, UserCircle } from 'lucide-react';

const Auth = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<string>('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupRole, setSignupRole] = useState<string>('student');
  const [signupSchoolId, setSignupSchoolId] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    
    const { error } = await signUp(
      signupEmail,
      signupPassword,
      signupName,
      signupRole,
      signupSchoolId
    );
    
    setSignupLoading(false);
    
    if (!error) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Hero Section */}
        <div className="hidden md:flex flex-col items-start space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary rounded-2xl">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
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
              Sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
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
                    <Input
                      id="login-password"
                      type="password"
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
                </form>
              </TabsContent>

              {/* Signup Tab - Disabled */}
              <TabsContent value="signup">
                <div className="space-y-4 mt-4">
                  <div className="p-6 bg-primary/5 border border-primary/20 rounded-lg text-center space-y-3">
                    <div className="text-4xl">🔒</div>
                    <h3 className="font-semibold text-foreground text-lg">Admin-Only Registration</h3>
                    <p className="text-sm text-muted-foreground">
                      Accounts for students, teachers, and parents are created only by an administrator. 
                      Public signup is disabled for security purposes.
                    </p>
                    <div className="pt-2 border-t border-border/50">
                      <p className="text-xs text-muted-foreground">
                        Please contact your school administrator to receive your login credentials.
                        You will be required to change your password on first login.
                      </p>
                    </div>
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
