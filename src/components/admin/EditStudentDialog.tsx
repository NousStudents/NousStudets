import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  student: {
    student_id: string;
    user_id: string;
    full_name: string;
    email: string;
    phone?: string;
    roll_no: string;
    class_id: string;
    section: string;
    gender: string;
    dob: string;
    admission_date: string;
    parent_id?: string;
  } | null;
  onSuccess: () => void;
  classes: Class[];
}

export function EditStudentDialog({ open, onOpenChange, student, onSuccess, classes }: EditStudentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [parents, setParents] = useState<Parent[]>([]);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    roll_no: "",
    class_id: "",
    section: "",
    gender: "",
    dob: "",
    admission_date: "",
    parent_id: "",
  });

  useEffect(() => {
    if (student && open) {
      setFormData({
        full_name: student.full_name,
        email: student.email,
        phone: student.phone || "",
        roll_no: student.roll_no,
        class_id: student.class_id,
        section: student.section,
        gender: student.gender,
        dob: student.dob,
        admission_date: student.admission_date,
        parent_id: student.parent_id || "",
      });
      fetchParents();
    }
  }, [student, open]);

  const fetchParents = async () => {
    try {
      const { data, error } = await supabase
        .from("parents")
        .select(`
          parent_id,
          users!inner (
            full_name,
            school_id
          )
        `)
        .eq("users.school_id", await getCurrentSchoolId());

      if (error) throw error;
      setParents(data?.map((p: any) => ({
        parent_id: p.parent_id,
        full_name: p.users.full_name
      })) || []);
    } catch (error) {
      console.error("Error fetching parents:", error);
    }
  };

  const getCurrentSchoolId = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    
    const { data: userData } = await supabase
      .from("users")
      .select("school_id")
      .eq("auth_user_id", data.user.id)
      .single();
    
    return userData?.school_id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) return;

    setLoading(true);
    try {
      // Update users table
      const { error: userError } = await supabase
        .from("users")
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
        })
        .eq("user_id", student.user_id);

      if (userError) throw userError;

      // Update students table
      const { error: studentError } = await supabase
        .from("students")
        .update({
          roll_no: formData.roll_no,
          class_id: formData.class_id,
          section: formData.section,
          gender: formData.gender,
          dob: formData.dob,
          admission_date: formData.admission_date,
          parent_id: formData.parent_id || null,
        })
        .eq("student_id", student.student_id);

      if (studentError) throw studentError;

      toast.success("Student updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to update student: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="roll_no">Roll Number *</Label>
              <Input
                id="roll_no"
                value={formData.roll_no}
                onChange={(e) => setFormData({ ...formData, roll_no: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="class_id">Class *</Label>
              <Select value={formData.class_id} onValueChange={(v) => setFormData({ ...formData, class_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.class_id} value={c.class_id}>
                      {c.class_name} - {c.section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section *</Label>
              <Input
                id="section"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admission_date">Admission Date</Label>
              <Input
                id="admission_date"
                type="date"
                value={formData.admission_date}
                onChange={(e) => setFormData({ ...formData, admission_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent_id">Parent</Label>
              <Select value={formData.parent_id} onValueChange={(v) => setFormData({ ...formData, parent_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No parent</SelectItem>
                  {parents.map((p) => (
                    <SelectItem key={p.parent_id} value={p.parent_id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
