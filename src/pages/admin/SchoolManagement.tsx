import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import { Building2 } from "lucide-react";

interface School {
  school_id: string;
  school_name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  website: string;
  subdomain: string;
}

export default function SchoolManagement() {
  const { user } = useAuth();
  const { schoolId } = useTenant();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSchoolData();
    }
  }, [user]);

  const fetchSchoolData = async () => {
    try {
      const { data: adminData } = await supabase
        .from("admins")
        .select("school_id")
        .eq("auth_user_id", user?.id)
        .single();

      if (adminData?.school_id) {
        const { data: schoolData, error } = await supabase
          .from("schools")
          .select("*")
          .eq("school_id", adminData.school_id)
          .single();

        if (error) throw error;
        setSchool(schoolData);
      }
    } catch (error) {
      console.error("Error fetching school:", error);
      toast.error("Failed to load school information");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("schools")
        .update({
          school_name: school.school_name,
          address: school.address,
          city: school.city,
          state: school.state,
          phone: school.phone,
          email: school.email,
          website: school.website,
        })
        .eq("school_id", school.school_id);

      if (error) throw error;
      toast.success("School information updated successfully");
    } catch (error) {
      console.error("Error updating school:", error);
      toast.error("Failed to update school information");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="container mx-auto p-6">
        <BackButton />
        <div className="text-center mt-8">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No school information found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <BackButton />
      <div className="flex items-center gap-3 mb-6 mt-4">
        <Building2 className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold text-foreground">School Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
          <CardDescription>Update your school's details and contact information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="school_name">School Name *</Label>
                <Input
                  id="school_name"
                  value={school.school_name}
                  onChange={(e) => setSchool({ ...school, school_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <Input id="subdomain" value={school.subdomain || ""} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={school.address || ""}
                onChange={(e) => setSchool({ ...school, address: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={school.city || ""}
                  onChange={(e) => setSchool({ ...school, city: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={school.state || ""}
                  onChange={(e) => setSchool({ ...school, state: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={school.phone || ""}
                  onChange={(e) => setSchool({ ...school, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={school.email || ""}
                  onChange={(e) => setSchool({ ...school, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={school.website || ""}
                onChange={(e) => setSchool({ ...school, website: e.target.value })}
              />
            </div>

            <Button type="submit" disabled={saving} className="w-full md:w-auto">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
