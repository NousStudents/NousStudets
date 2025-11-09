import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, ArrowLeft, LogOut } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    profile_picture: "",
    role: "",
  });

  const [studentDetails, setStudentDetails] = useState<{
    roll_no?: string;
    class_name?: string;
    section?: string;
    parent_name?: string;
    parent_phone?: string;
    parent_relation?: string;
    class_teacher_name?: string;
    class_teacher_phone?: string;
  } | null>(null);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", user?.id)
        .single();

      if (userError) throw userError;

      // Get profile picture from users table
      const profilePicture = userData.profile_image || "";
      
      if (userData.role === "student") {
        // Fetch student data
        const { data: studentData } = await supabase
          .from("students")
          .select("roll_no, class_id, parent_id")
          .eq("user_id", userData.user_id)
          .single();

        // Fetch class details separately
        let classDetails = {};
        if (studentData?.class_id) {
          const { data: classData } = await supabase
            .from("classes")
            .select("class_name, section, class_teacher_id")
            .eq("class_id", studentData.class_id)
            .single();

          if (classData) {
            classDetails = {
              class_name: classData.class_name || "",
              section: classData.section || "",
            };

            // Fetch class teacher details
            if (classData.class_teacher_id) {
              const { data: teacherData } = await supabase
                .from("teachers")
                .select("user_id")
                .eq("teacher_id", classData.class_teacher_id)
                .single();

              if (teacherData) {
                const { data: teacherUserData } = await supabase
                  .from("users")
                  .select("full_name, phone")
                  .eq("user_id", teacherData.user_id)
                  .single();

                classDetails = {
                  ...classDetails,
                  class_teacher_name: teacherUserData?.full_name || "",
                  class_teacher_phone: teacherUserData?.phone || "",
                };
              }
            }
          }
        }

        // Fetch parent details
        let parentDetails = {};
        if (studentData?.parent_id) {
          const { data: parentData } = await supabase
            .from("parents")
            .select("user_id, relation")
            .eq("parent_id", studentData.parent_id)
            .single();

          if (parentData) {
            const { data: parentUserData } = await supabase
              .from("users")
              .select("full_name, phone")
              .eq("user_id", parentData.user_id)
              .single();

            parentDetails = {
              parent_name: parentUserData?.full_name || "",
              parent_phone: parentUserData?.phone || "",
              parent_relation: parentData?.relation || "",
            };
          }
        }

        setStudentDetails({
          roll_no: studentData?.roll_no || "",
          ...classDetails,
          ...parentDetails,
        });
      }

      setProfile({
        full_name: userData.full_name || "",
        email: userData.email || "",
        phone: userData.phone || "",
        profile_picture: profilePicture,
        role: userData.role || "",
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5242880) {
      toast({
        title: "Error",
        description: "Image size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({
        title: "Error",
        description: "Only JPEG, PNG, and WebP images are allowed",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      // Update profile picture in users table
      await supabase
        .from("users")
        .update({ profile_image: publicUrl })
        .eq("auth_user_id", user?.id);

      // Also update students table if user is a student
      const { data: userData } = await supabase
        .from("users")
        .select("user_id, role")
        .eq("auth_user_id", user?.id)
        .single();

      if (userData?.role === "student") {
        await supabase
          .from("students")
          .update({ profile_picture: publicUrl })
          .eq("user_id", userData.user_id);
      }

      setProfile(prev => ({ ...prev, profile_picture: publicUrl }));
      
      toast({
        title: "Success",
        description: "Profile image updated successfully",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
        })
        .eq("auth_user_id", user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password changed successfully",
      });

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/auth");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Image Section */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={profile.profile_picture} />
                <AvatarFallback className="text-2xl">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-center space-y-2">
                <Label
                  htmlFor="profile-image"
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                    {uploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {uploadingImage ? "Uploading..." : "Upload New Photo"}
                  </div>
                </Label>
                <Input
                  id="profile-image"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                <p className="text-xs text-muted-foreground">
                  JPG, PNG or WebP. Max 5MB.
                </p>
              </div>
            </div>

            <Separator />

            {/* Personal Information */}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) =>
                    setProfile({ ...profile, full_name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={profile.role}
                  disabled
                  className="bg-muted capitalize"
                />
              </div>

              <Button type="submit" disabled={updating}>
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Profile
              </Button>
            </form>

            {/* Student-specific details */}
            {profile.role === "student" && studentDetails && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Academic Details</h3>
                  
                  {studentDetails.roll_no && (
                    <div className="space-y-2">
                      <Label>Roll Number</Label>
                      <Input
                        value={studentDetails.roll_no}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  )}

                  {studentDetails.class_name && (
                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Input
                        value={`${studentDetails.class_name}${studentDetails.section ? ` - ${studentDetails.section}` : ''}`}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  )}

                  {studentDetails.class_teacher_name && (
                    <>
                      <h3 className="text-lg font-semibold mt-6">Class Teacher</h3>
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={studentDetails.class_teacher_name}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      {studentDetails.class_teacher_phone && (
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            value={studentDetails.class_teacher_phone}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {studentDetails.parent_name && (
                    <>
                      <h3 className="text-lg font-semibold mt-6">Parent/Guardian Details</h3>
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={studentDetails.parent_name}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      {studentDetails.parent_relation && (
                        <div className="space-y-2">
                          <Label>Relation</Label>
                          <Input
                            value={studentDetails.parent_relation}
                            disabled
                            className="bg-muted capitalize"
                          />
                        </div>
                      )}
                      {studentDetails.parent_phone && (
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            value={studentDetails.parent_phone}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            <Separator />

            {/* Change Password */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h3 className="text-lg font-semibold">Change Password</h3>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) =>
                    setPasswords({ ...passwords, newPassword: e.target.value })
                  }
                  placeholder="Enter new password"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    setPasswords({
                      ...passwords,
                      confirmPassword: e.target.value,
                    })
                  }
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <Button type="submit" disabled={updating} variant="secondary">
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
