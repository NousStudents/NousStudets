import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { useEffect } from "react";

export default function SuperAdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isSuperAdmin, loading: checkingAdmin } = useSuperAdmin();

  useEffect(() => {
    if (user && isSuperAdmin) {
      navigate("/super-admin");
    }
  }, [user, isSuperAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Sign in with email and password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw new Error(`Login failed: ${signInError.message}`);
      }

      if (!signInData.user) {
        throw new Error("Login failed: No user data received");
      }

      // Step 2: Check if user is super admin
      const { data: superAdminData, error: superAdminError } = await supabase
        .from("super_admins")
        .select("super_admin_id, email, full_name, status")
        .eq("auth_user_id", signInData.user.id)
        .eq("status", "active")
        .maybeSingle();

      if (superAdminError) {
        console.error("Super admin check error:", superAdminError);
        await supabase.auth.signOut();
        throw new Error(
          `Database error: ${superAdminError.message}. Please contact support.`
        );
      }

      if (!superAdminData) {
        await supabase.auth.signOut();
        throw new Error(
          "Access Denied: Your account is not registered as a super administrator. Please contact the system administrator."
        );
      }

      // Success!
      toast({
        title: "Login Successful",
        description: `Welcome back, ${superAdminData.full_name}!`,
      });

      navigate("/super-admin");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Super Admin Login</CardTitle>
          <CardDescription>
            Access the super admin dashboard to manage schools and administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Button
                type="button"
                variant="link"
                className="p-0 h-auto"
                onClick={() => navigate("/super-admin/signup")}
              >
                Sign Up
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
