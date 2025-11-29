import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { EditStudentDialogTabs } from "./EditStudentDialogTabs";

interface Class {
  class_id: string;
  class_name: string;
  section: string;
}

interface Parent {
  parent_id: string;
  full_name: string;
}

interface EditStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: any | null;
  onSuccess: () => void;
  classes: Class[];
}

export function EditStudentDialog({ open, onOpenChange, student, onSuccess, classes }: EditStudentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [parents, setParents] = useState<Parent[]>([]);
  const [activeTab, setActiveTab] = useState("personal");
  const [formData, setFormData] = useState({
    // Personal
    full_name: "",
    admission_number: "",
    roll_no: "",
    class_id: "",
    section: "",
    gender: "",
    dob: "",
    blood_group: "",
    nationality: "Indian",
    mother_tongue: "",
    religion: "",
    // Contact
    email: "",
    phone: "",
    student_phone: "",
    student_email: "",
    address: "",
    door_no: "",
    street: "",
    village_town: "",
    district: "",
    city: "",
    state: "",
    pincode: "",
    // Academic
    academic_year: "",
    previous_school: "",
    admission_date: "",
    medium_of_instruction: "",
    student_category: "",
    // Health
    height: "",
    weight: "",
    allergies: "",
    medical_conditions: "",
    emergency_contact_name: "",
    emergency_contact_relationship: "",
    emergency_contact_mobile: "",
    family_doctor_name: "",
    doctor_contact_number: "",
    // Interests
    hobbies: "",
    interests: "",
    achievements: "",
    languages_known: "",
    // Family
    father_name: "",
    father_phone: "",
    father_email: "",
    father_occupation: "",
    mother_name: "",
    mother_phone: "",
    mother_email: "",
    mother_occupation: "",
    guardian_name: "",
    guardian_relationship: "",
    guardian_contact: "",
    parent_id: "",
  });

  useEffect(() => {
    if (student && open) {
      setFormData({
        full_name: student.full_name || "",
        admission_number: student.admission_number || "",
        roll_no: student.roll_no || "",
        class_id: student.class_id || "",
        section: student.section || "",
        gender: student.gender || "",
        dob: student.dob || "",
        blood_group: student.blood_group || "",
        nationality: student.nationality || "Indian",
        mother_tongue: student.mother_tongue || "",
        religion: student.religion || "",
        email: student.email || "",
        phone: student.phone || "",
        student_phone: student.student_phone || "",
        student_email: student.student_email || "",
        address: student.address || "",
        door_no: student.door_no || "",
        street: student.street || "",
        village_town: student.village_town || "",
        district: student.district || "",
        city: student.city || "",
        state: student.state || "",
        pincode: student.pincode || "",
        academic_year: student.academic_year || "",
        previous_school: student.previous_school || "",
        admission_date: student.admission_date || student.date_of_admission || "",
        medium_of_instruction: student.medium_of_instruction || "",
        student_category: student.student_category || "",
        height: student.height || "",
        weight: student.weight || "",
        allergies: student.allergies || "",
        medical_conditions: student.medical_conditions || "",
        emergency_contact_name: student.emergency_contact_name || "",
        emergency_contact_relationship: student.emergency_contact_relationship || "",
        emergency_contact_mobile: student.emergency_contact_mobile || "",
        family_doctor_name: student.family_doctor_name || "",
        doctor_contact_number: student.doctor_contact_number || "",
        hobbies: student.hobbies || "",
        interests: student.interests || "",
        achievements: student.achievements || "",
        languages_known: student.languages_known || "",
        father_name: student.father_name || "",
        father_phone: student.father_phone || "",
        father_email: student.father_email || "",
        father_occupation: student.father_occupation || "",
        mother_name: student.mother_name || "",
        mother_phone: student.mother_phone || "",
        mother_email: student.mother_email || "",
        mother_occupation: student.mother_occupation || "",
        guardian_name: student.guardian_name || "",
        guardian_relationship: student.guardian_relationship || "",
        guardian_contact: student.guardian_contact || "",
        parent_id: student.parent_id || "",
      });
      fetchParents();
    }
  }, [student, open]);

  const fetchParents = async () => {
    try {
      const schoolId = await getCurrentSchoolId();
      const { data, error } = await supabase
        .from("parents")
        .select(`
          parent_id,
          full_name,
          school_id
        `)
        .eq("school_id", schoolId);

      if (error) throw error;
      setParents(data?.map((p: any) => ({
        parent_id: p.parent_id,
        full_name: p.full_name
      })) || []);
    } catch (error) {
      console.error("Error fetching parents:", error);
    }
  };

  const getCurrentSchoolId = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    
    const { data: adminData } = await supabase
      .from("admins")
      .select("school_id")
      .eq("auth_user_id", data.user.id)
      .single();
    
    return adminData?.school_id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    // Validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast.error("Invalid email format");
      return;
    }
    if (formData.student_phone && !/^\d{10}$/.test(formData.student_phone.replace(/\D/g, ''))) {
      toast.error("Phone number must be 10 digits");
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        full_name: formData.full_name,
        admission_number: formData.admission_number || null,
        roll_no: formData.roll_no,
        class_id: formData.class_id,
        section: formData.section,
        gender: formData.gender,
        dob: formData.dob || null,
        blood_group: formData.blood_group || null,
        nationality: formData.nationality,
        mother_tongue: formData.mother_tongue || null,
        religion: formData.religion || null,
        email: formData.email,
        phone: formData.phone || null,
        student_phone: formData.student_phone || null,
        student_email: formData.student_email || null,
        address: formData.address || null,
        door_no: formData.door_no || null,
        street: formData.street || null,
        village_town: formData.village_town || null,
        district: formData.district || null,
        city: formData.city || null,
        state: formData.state || null,
        pincode: formData.pincode || null,
        academic_year: formData.academic_year || null,
        previous_school: formData.previous_school || null,
        admission_date: formData.admission_date || null,
        medium_of_instruction: formData.medium_of_instruction || null,
        student_category: formData.student_category || null,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        allergies: formData.allergies || null,
        medical_conditions: formData.medical_conditions || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_relationship: formData.emergency_contact_relationship || null,
        emergency_contact_mobile: formData.emergency_contact_mobile || null,
        family_doctor_name: formData.family_doctor_name || null,
        doctor_contact_number: formData.doctor_contact_number || null,
        hobbies: formData.hobbies || null,
        interests: formData.interests || null,
        achievements: formData.achievements || null,
        languages_known: formData.languages_known || null,
        father_name: formData.father_name || null,
        father_phone: formData.father_phone || null,
        father_email: formData.father_email || null,
        father_occupation: formData.father_occupation || null,
        mother_name: formData.mother_name || null,
        mother_phone: formData.mother_phone || null,
        mother_email: formData.mother_email || null,
        mother_occupation: formData.mother_occupation || null,
        guardian_name: formData.guardian_name || null,
        guardian_relationship: formData.guardian_relationship || null,
        guardian_contact: formData.guardian_contact || null,
        parent_id: formData.parent_id || null,
        profile_updated_at: new Date().toISOString(),
      };

      const { error: studentError } = await supabase
        .from("students")
        .update(updateData)
        .eq("student_id", student.student_id);

      if (studentError) throw studentError;

      toast.success("✅ Student profile updated successfully!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to update: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student Profile - Comprehensive Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <EditStudentDialogTabs 
            formData={formData}
            setFormData={setFormData}
            classes={classes}
            parents={parents}
          />
          
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              💾 Save All Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
