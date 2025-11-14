import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading } = useSuperAdmin();
  const [creating, setCreating] = useState(false);

  // School form state
  const [schoolData, setSchoolData] = useState({
    school_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    website: "",
    subdomain: "",
  });

  // Admin form state
  const [adminData, setAdminData] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    school_id: "",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")}>Go to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { data, error } = await supabase
        .from("schools")
        .insert([schoolData])
        .select()
        .single();

      if (error) throw error;

      toast.success("School created successfully!");
      setSchoolData({
        school_name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        website: "",
        subdomain: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to create school");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminData.email,
        password: adminData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // Create admin record
      const { error: adminError } = await supabase.from("admins").insert([{
        auth_user_id: authData.user.id,
        email: adminData.email,
        full_name: adminData.full_name,
        phone: adminData.phone,
        school_id: adminData.school_id,
        status: "active",
      }]);

      if (adminError) throw adminError;

      toast.success("Admin created successfully!");
      setAdminData({
        email: "",
        password: "",
        full_name: "",
        phone: "",
        school_id: "",
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to create admin");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage schools and administrators</p>
      </div>

      <Tabs defaultValue="school" className="max-w-3xl">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="school">Create School</TabsTrigger>
          <TabsTrigger value="admin">Create Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="school">
          <Card>
            <CardHeader>
              <CardTitle>Create New School</CardTitle>
              <CardDescription>Add a new school to the system</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSchool} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="school_name">School Name *</Label>
                    <Input
                      id="school_name"
                      required
                      value={schoolData.school_name}
                      onChange={(e) => setSchoolData({ ...schoolData, school_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Subdomain</Label>
                    <Input
                      id="subdomain"
                      value={schoolData.subdomain}
                      onChange={(e) => setSchoolData({ ...schoolData, subdomain: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={schoolData.email}
                      onChange={(e) => setSchoolData({ ...schoolData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={schoolData.phone}
                      onChange={(e) => setSchoolData({ ...schoolData, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={schoolData.address}
                      onChange={(e) => setSchoolData({ ...schoolData, address: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={schoolData.city}
                      onChange={(e) => setSchoolData({ ...schoolData, city: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={schoolData.state}
                      onChange={(e) => setSchoolData({ ...schoolData, state: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={schoolData.website}
                      onChange={(e) => setSchoolData({ ...schoolData, website: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create School
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admin">
          <Card>
            <CardHeader>
              <CardTitle>Create School Admin</CardTitle>
              <CardDescription>Add an administrator for a school</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateAdmin} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin_full_name">Full Name *</Label>
                    <Input
                      id="admin_full_name"
                      required
                      value={adminData.full_name}
                      onChange={(e) => setAdminData({ ...adminData, full_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_email">Email *</Label>
                    <Input
                      id="admin_email"
                      type="email"
                      required
                      value={adminData.email}
                      onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_password">Password *</Label>
                    <Input
                      id="admin_password"
                      type="password"
                      required
                      value={adminData.password}
                      onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_phone">Phone</Label>
                    <Input
                      id="admin_phone"
                      value={adminData.phone}
                      onChange={(e) => setAdminData({ ...adminData, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="school_id">School ID *</Label>
                    <Input
                      id="school_id"
                      required
                      placeholder="Enter the school UUID"
                      value={adminData.school_id}
                      onChange={(e) => setAdminData({ ...adminData, school_id: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Admin
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
