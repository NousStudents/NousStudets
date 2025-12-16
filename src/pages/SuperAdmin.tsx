import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, School, UserPlus, Building2, Users, Shield, ArrowRight } from "lucide-react";

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { isSuperAdmin, loading } = useSuperAdmin();
  const [creating, setCreating] = useState(false);
  const [schools, setSchools] = useState<Array<{ school_id: string; school_name: string }>>([]);
  const [stats, setStats] = useState({ schools: 0, admins: 0 });

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

  useEffect(() => {
    const fetchData = async () => {
      const [schoolsRes, adminsRes] = await Promise.all([
        supabase.from("schools").select("school_id, school_name").order("school_name"),
        supabase.from("admins").select("admin_id", { count: "exact", head: true }),
      ]);

      if (!schoolsRes.error) {
        setSchools(schoolsRes.data || []);
        setStats((prev) => ({ ...prev, schools: schoolsRes.data?.length || 0 }));
      }
      if (!adminsRes.error) {
        setStats((prev) => ({ ...prev, admins: adminsRes.count || 0 }));
      }
    };

    if (isSuperAdmin) {
      fetchData();
    }
  }, [isSuperAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>You don't have permission to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/")} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { error } = await supabase.from("schools").insert([schoolData]).select().single();

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
      setStats((prev) => ({ ...prev, schools: prev.schools + 1 }));
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminData.email,
        password: adminData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      const { error: adminError } = await supabase.from("admins").insert([
        {
          auth_user_id: authData.user.id,
          email: adminData.email,
          full_name: adminData.full_name,
          phone: adminData.phone,
          school_id: adminData.school_id,
          status: "active",
        },
      ]);

      if (adminError) throw adminError;

      toast.success("Admin created successfully!");
      setAdminData({
        email: "",
        password: "",
        full_name: "",
        phone: "",
        school_id: "",
      });
      setStats((prev) => ({ ...prev, admins: prev.admins + 1 }));
    } catch (error: any) {
      toast.error(error.message || "Failed to create admin");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {/* Fixed width container for consistent layout */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Section */}
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Super Admin</h1>
                <p className="text-sm text-muted-foreground">Manage schools and administrators</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/super-admin/profile")}
              className="group"
            >
              View All Schools & Users
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.schools}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Schools</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-card/50 backdrop-blur">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-foreground">{stats.admins}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Total Admins</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Tabs */}
        <Card className="border-none shadow-lg">
          <Tabs defaultValue="school" className="w-full">
            <CardHeader className="pb-0">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="school" className="flex items-center gap-2 text-sm sm:text-base">
                  <School className="h-4 w-4" />
                  <span className="hidden sm:inline">Create</span> School
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-2 text-sm sm:text-base">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create</span> Admin
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              <TabsContent value="school" className="mt-0">
                <div className="space-y-1 mb-6">
                  <h3 className="text-lg font-semibold text-foreground">New School</h3>
                  <p className="text-sm text-muted-foreground">Add a new school to the system</p>
                </div>
                <form onSubmit={handleCreateSchool} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="school_name" className="text-sm font-medium">
                        School Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="school_name"
                        required
                        placeholder="Enter school name"
                        value={schoolData.school_name}
                        onChange={(e) => setSchoolData({ ...schoolData, school_name: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subdomain" className="text-sm font-medium">
                        Subdomain
                      </Label>
                      <Input
                        id="subdomain"
                        placeholder="e.g., schoolname"
                        value={schoolData.subdomain}
                        onChange={(e) => setSchoolData({ ...schoolData, subdomain: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="school@example.com"
                        value={schoolData.email}
                        onChange={(e) => setSchoolData({ ...schoolData, email: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        placeholder="+1 234 567 8900"
                        value={schoolData.phone}
                        onChange={(e) => setSchoolData({ ...schoolData, phone: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="address" className="text-sm font-medium">
                        Address
                      </Label>
                      <Input
                        id="address"
                        placeholder="Full street address"
                        value={schoolData.address}
                        onChange={(e) => setSchoolData({ ...schoolData, address: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">
                        City
                      </Label>
                      <Input
                        id="city"
                        placeholder="City name"
                        value={schoolData.city}
                        onChange={(e) => setSchoolData({ ...schoolData, city: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm font-medium">
                        State
                      </Label>
                      <Input
                        id="state"
                        placeholder="State/Province"
                        value={schoolData.state}
                        onChange={(e) => setSchoolData({ ...schoolData, state: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="website" className="text-sm font-medium">
                        Website
                      </Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://www.school.com"
                        value={schoolData.website}
                        onChange={(e) => setSchoolData({ ...schoolData, website: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={creating} className="w-full h-11 text-base font-medium">
                    {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Create School
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin" className="mt-0">
                <div className="space-y-1 mb-6">
                  <h3 className="text-lg font-semibold text-foreground">New Administrator</h3>
                  <p className="text-sm text-muted-foreground">Add an administrator for a school</p>
                </div>
                <form onSubmit={handleCreateAdmin} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin_full_name" className="text-sm font-medium">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="admin_full_name"
                        required
                        placeholder="Enter full name"
                        value={adminData.full_name}
                        onChange={(e) => setAdminData({ ...adminData, full_name: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin_email" className="text-sm font-medium">
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="admin_email"
                        type="email"
                        required
                        placeholder="admin@school.com"
                        value={adminData.email}
                        onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin_password" className="text-sm font-medium">
                        Password <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="admin_password"
                        type="password"
                        required
                        placeholder="••••••••"
                        value={adminData.password}
                        onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="admin_phone" className="text-sm font-medium">
                        Phone
                      </Label>
                      <Input
                        id="admin_phone"
                        placeholder="+1 234 567 8900"
                        value={adminData.phone}
                        onChange={(e) => setAdminData({ ...adminData, phone: e.target.value })}
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="school_id" className="text-sm font-medium">
                        Assign to School <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={adminData.school_id}
                        onValueChange={(value) => setAdminData({ ...adminData, school_id: value })}
                        required
                      >
                        <SelectTrigger id="school_id" className="h-11">
                          <SelectValue placeholder="Select a school" />
                        </SelectTrigger>
                        <SelectContent>
                          {schools.length === 0 ? (
                            <SelectItem value="_" disabled>
                              No schools available
                            </SelectItem>
                          ) : (
                            schools.map((school) => (
                              <SelectItem key={school.school_id} value={school.school_id}>
                                {school.school_name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={creating || schools.length === 0}
                    className="w-full h-11 text-base font-medium"
                  >
                    {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Create Admin
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
