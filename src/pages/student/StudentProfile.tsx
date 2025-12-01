import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BackButton } from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, User, Phone, Mail, MapPin, Heart, GraduationCap, 
  Stethoscope, Trophy, Users, FileText, Calendar, Edit2, Save, X, LogOut
} from "lucide-react";

interface StudentProfile {
  // Personal Information
  full_name: string;
  admission_number: string | null;
  roll_no: string | null;
  class_id: string | null;
  section: string | null;
  gender: string | null;
  dob: string | null;
  blood_group: string | null;
  nationality: string | null;
  mother_tongue: string | null;
  religion: string | null;
  profile_picture: string | null;
  
  // Contact Information
  student_phone: string | null;
  student_email: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  door_no: string | null;
  street: string | null;
  village_town: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  
  // Academic Information
  academic_year: string | null;
  previous_school: string | null;
  date_of_admission: string | null;
  admission_date: string | null;
  medium_of_instruction: string | null;
  student_category: string | null;
  
  // Health & Emergency
  height: number | null;
  weight: number | null;
  allergies: string | null;
  medical_conditions: string | null;
  emergency_contact_name: string | null;
  emergency_contact_relationship: string | null;
  emergency_contact_mobile: string | null;
  family_doctor_name: string | null;
  doctor_contact_number: string | null;
  
  // Interests & Personality
  hobbies: string | null;
  interests: string | null;
  achievements: string | null;
  languages_known: string | null;
  
  // Family Details
  father_name: string | null;
  father_phone: string | null;
  father_email: string | null;
  father_occupation: string | null;
  mother_name: string | null;
  mother_phone: string | null;
  mother_email: string | null;
  mother_occupation: string | null;
  guardian_name: string | null;
  guardian_relationship: string | null;
  guardian_contact: string | null;
  
  // Documents
  birth_certificate_url: string | null;
  transfer_certificate_url: string | null;
  aadhar_card_url: string | null;
  id_card_url: string | null;
  report_cards_url: string | null;
  other_documents_url: string | null;
  
  // Class info
  classes?: {
    class_name: string;
    section: string;
  };
}

export default function StudentProfile() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<StudentProfile>>({});

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          classes (
            class_name,
            section
          )
        `)
        .eq("auth_user_id", user?.id)
        .single();

      if (error) throw error;
      setProfile(data as unknown as StudentProfile);
      setEditedProfile(data as unknown as StudentProfile);
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

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile({ ...profile });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile({ ...profile });
  };

  const handleSave = async () => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("students")
        .update({
          dob: editedProfile.dob,
          height: editedProfile.height,
          weight: editedProfile.weight,
          hobbies: editedProfile.hobbies,
          interests: editedProfile.interests,
          achievements: editedProfile.achievements,
          languages_known: editedProfile.languages_known,
          blood_group: editedProfile.blood_group,
          allergies: editedProfile.allergies,
          medical_conditions: editedProfile.medical_conditions,
          profile_updated_at: new Date().toISOString()
        })
        .eq("auth_user_id", user?.id);

      if (error) throw error;

      setProfile({ ...profile, ...editedProfile });
      setIsEditing(false);
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      // Refresh profile data
      fetchProfile();
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

  const getInitials = (name: string) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "ST";
  };

  const downloadDocument = async (url: string, fileName: string) => {
    if (!url) {
      toast({
        title: "No Document",
        description: "This document has not been uploaded yet.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <BackButton />
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Profile not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <BackButton />
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button onClick={handleEdit} variant="outline">
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button onClick={signOut} variant="destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleSave} disabled={updating}>
                {updating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
              <Button onClick={handleCancel} variant="outline" disabled={updating}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Header with Profile Picture */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <Avatar className="h-32 w-32">
              <AvatarImage src={profile.profile_picture} />
              <AvatarFallback className="text-3xl">
                {getInitials(profile.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center md:text-left space-y-2">
              <h1 className="text-3xl font-bold text-foreground">{profile.full_name}</h1>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <Badge variant="secondary">
                  {profile.classes?.class_name} - {profile.classes?.section || profile.section}
                </Badge>
                <Badge variant="outline">Roll No: {profile.roll_no}</Badge>
                {profile.admission_number && (
                  <Badge variant="outline">Admission No: {profile.admission_number}</Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                Gender: {profile.gender} | DOB: {profile.dob ? new Date(profile.dob).toLocaleDateString() : 'Not set'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    type="date"
                    value={editedProfile.dob || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, dob: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blood_group">Blood Group</Label>
                  <Input
                    id="blood_group"
                    value={editedProfile.blood_group || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, blood_group: e.target.value })}
                    placeholder="e.g., A+, B+, O+, AB+"
                  />
                </div>
              </>
            ) : (
              <>
                <InfoRow label="Date of Birth" value={profile.dob ? new Date(profile.dob).toLocaleDateString() : 'Not set'} />
                <InfoRow label="Blood Group" value={profile.blood_group} important />
                <InfoRow label="Nationality" value={profile.nationality} />
                <InfoRow label="Mother Tongue" value={profile.mother_tongue} />
                <InfoRow label="Religion" value={profile.religion} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Student Phone" value={profile.student_phone} icon={<Phone className="h-4 w-4" />} />
            <InfoRow label="Student Email" value={profile.student_email || profile.email} icon={<Mail className="h-4 w-4" />} />
            <InfoRow label="Phone" value={profile.phone} icon={<Phone className="h-4 w-4" />} />
            <Separator />
            <div className="space-y-1">
              <p className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Address
              </p>
              <p className="text-sm text-muted-foreground">
                {[profile.door_no, profile.street, profile.village_town, profile.district, profile.city, profile.state, profile.pincode]
                  .filter(Boolean)
                  .join(", ") || profile.address || "Not provided"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Academic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Class & Section" value={`${profile.classes?.class_name || ''} - ${profile.classes?.section || profile.section || ''}`} />
            <InfoRow label="Academic Year" value={profile.academic_year} />
            <InfoRow label="Medium of Instruction" value={profile.medium_of_instruction} />
            <InfoRow label="Student Category" value={profile.student_category} />
            <InfoRow label="Previous School" value={profile.previous_school} />
            <InfoRow label="Date of Admission" value={profile.date_of_admission || profile.admission_date} />
          </CardContent>
        </Card>

        {/* Health & Emergency Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Health & Emergency
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={editedProfile.height || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, height: parseFloat(e.target.value) || null })}
                      placeholder="Enter height"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={editedProfile.weight || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, weight: parseFloat(e.target.value) || null })}
                      placeholder="Enter weight"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    value={editedProfile.allergies || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, allergies: e.target.value })}
                    placeholder="List any allergies (food, medicine, etc.)"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medical_conditions">Medical Conditions</Label>
                  <Textarea
                    id="medical_conditions"
                    value={editedProfile.medical_conditions || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, medical_conditions: e.target.value })}
                    placeholder="Any existing medical conditions"
                    rows={2}
                  />
                </div>
              </>
            ) : (
              <>
                <InfoRow label="Height (cm)" value={profile.height} />
                <InfoRow label="Weight (kg)" value={profile.weight} />
                <InfoRow label="Allergies" value={profile.allergies} />
                <InfoRow label="Medical Conditions" value={profile.medical_conditions} />
                <Separator />
                <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-foreground">Emergency Contact</p>
                  <InfoRow label="Name" value={profile.emergency_contact_name} compact />
                  <InfoRow label="Relationship" value={profile.emergency_contact_relationship} compact />
                  <InfoRow label="Mobile" value={profile.emergency_contact_mobile} compact />
                </div>
                <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Family Doctor
                  </p>
                  <InfoRow label="Name" value={profile.family_doctor_name} compact />
                  <InfoRow label="Contact" value={profile.doctor_contact_number} compact />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Interests & Personality */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Interests & Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="hobbies">Hobbies</Label>
                  <Textarea
                    id="hobbies"
                    value={editedProfile.hobbies || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, hobbies: e.target.value })}
                    placeholder="e.g., Reading, Playing Cricket, Drawing"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interests">Interests & Skills</Label>
                  <Textarea
                    id="interests"
                    value={editedProfile.interests || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, interests: e.target.value })}
                    placeholder="e.g., Science, Technology, Music"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="achievements">Achievements & Awards</Label>
                  <Textarea
                    id="achievements"
                    value={editedProfile.achievements || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, achievements: e.target.value })}
                    placeholder="List your achievements and awards"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="languages_known">Languages Known</Label>
                  <Input
                    id="languages_known"
                    value={editedProfile.languages_known || ''}
                    onChange={(e) => setEditedProfile({ ...editedProfile, languages_known: e.target.value })}
                    placeholder="e.g., English, Hindi, Tamil"
                  />
                </div>
              </>
            ) : (
              <>
                <InfoRow label="Hobbies" value={profile.hobbies} />
                <InfoRow label="Interests/Skills" value={profile.interests} />
                <InfoRow label="Achievements/Awards" value={profile.achievements} />
                <InfoRow label="Languages Known" value={profile.languages_known} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Family Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Family Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-semibold text-foreground">Father Information</p>
              <InfoRow label="Name" value={profile.father_name} compact />
              <InfoRow label="Phone" value={profile.father_phone} compact />
              <InfoRow label="Email" value={profile.father_email} compact />
              <InfoRow label="Occupation" value={profile.father_occupation} compact />
            </div>
            
            <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
              <p className="text-sm font-semibold text-foreground">Mother Information</p>
              <InfoRow label="Name" value={profile.mother_name} compact />
              <InfoRow label="Phone" value={profile.mother_phone} compact />
              <InfoRow label="Email" value={profile.mother_email} compact />
              <InfoRow label="Occupation" value={profile.mother_occupation} compact />
            </div>

            {profile.guardian_name && (
              <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-semibold text-foreground">Guardian Information</p>
                <InfoRow label="Name" value={profile.guardian_name} compact />
                <InfoRow label="Relationship" value={profile.guardian_relationship} compact />
                <InfoRow label="Contact" value={profile.guardian_contact} compact />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Student Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DocumentCard 
              title="Birth Certificate" 
              url={profile.birth_certificate_url}
              onDownload={() => downloadDocument(profile.birth_certificate_url, 'birth-certificate.pdf')}
            />
            <DocumentCard 
              title="Transfer Certificate" 
              url={profile.transfer_certificate_url}
              onDownload={() => downloadDocument(profile.transfer_certificate_url, 'transfer-certificate.pdf')}
            />
            <DocumentCard 
              title="Aadhar Card" 
              url={profile.aadhar_card_url}
              onDownload={() => downloadDocument(profile.aadhar_card_url, 'aadhar-card.pdf')}
            />
            <DocumentCard 
              title="ID Card" 
              url={profile.id_card_url}
              onDownload={() => downloadDocument(profile.id_card_url, 'id-card.pdf')}
            />
            <DocumentCard 
              title="Report Cards" 
              url={profile.report_cards_url}
              onDownload={() => downloadDocument(profile.report_cards_url, 'report-cards.pdf')}
            />
            <DocumentCard 
              title="Other Documents" 
              url={profile.other_documents_url}
              onDownload={() => downloadDocument(profile.other_documents_url, 'other-documents.pdf')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
function InfoRow({ 
  label, 
  value, 
  icon, 
  important = false, 
  compact = false 
}: { 
  label: string; 
  value: any; 
  icon?: React.ReactNode; 
  important?: boolean;
  compact?: boolean;
}) {
  const displayValue = value || "Not provided";
  
  return (
    <div className={`flex ${compact ? 'justify-between items-center' : 'flex-col'} gap-1`}>
      <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-muted-foreground flex items-center gap-1`}>
        {icon}
        {label}
      </p>
      <p className={`${compact ? 'text-xs' : 'text-sm'} ${important ? 'font-bold text-primary' : 'text-foreground'}`}>
        {displayValue}
      </p>
    </div>
  );
}

function DocumentCard({ 
  title, 
  url, 
  onDownload 
}: { 
  title: string; 
  url: string; 
  onDownload: () => void;
}) {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <p className="font-medium text-sm">{title}</p>
      </div>
      {url ? (
        <Button variant="outline" size="sm" onClick={onDownload} className="w-full">
          View / Download
        </Button>
      ) : (
        <p className="text-xs text-muted-foreground">Not uploaded</p>
      )}
    </div>
  );
}
