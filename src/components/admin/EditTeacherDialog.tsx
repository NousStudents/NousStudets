import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface EditTeacherDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teacher: {
    teacher_id: string;
    user_id: string;
    full_name: string;
    email: string;
    phone?: string;
    qualification: string;
    experience: number;
    subject_specialization?: string;
  } | null;
  onSuccess: () => void;
}

export function EditTeacherDialog({ open, onOpenChange, teacher, onSuccess }: EditTeacherDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    qualification: "",
    experience: 0,
    subject_specialization: "",
  });

  useEffect(() => {
    if (teacher && open) {
      setFormData({
        full_name: teacher.full_name,
        email: teacher.email,
        phone: teacher.phone || "",
        qualification: teacher.qualification,
        experience: teacher.experience,
        subject_specialization: teacher.subject_specialization || "",
      });
    }
  }, [teacher, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacher) return;

    setLoading(true);
    try {
      // Update teachers table with all fields
      const { error: teacherError} = await supabase
        .from("teachers")
        .update({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone || null,
          qualification: formData.qualification,
          experience: formData.experience,
          subject_specialization: formData.subject_specialization || null,
        })
        .eq("teacher_id", teacher.teacher_id);

      if (teacherError) throw teacherError;

      toast.success("Teacher updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to update teacher: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Teacher</DialogTitle>
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
              <Label htmlFor="qualification">Qualification *</Label>
              <Input
                id="qualification"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                required
                placeholder="e.g., M.Ed, B.Ed"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="experience">Experience (years) *</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject_specialization">Subject Specialization</Label>
            <Textarea
              id="subject_specialization"
              value={formData.subject_specialization}
              onChange={(e) => setFormData({ ...formData, subject_specialization: e.target.value })}
              placeholder="e.g., Mathematics, Physics, Chemistry"
              rows={3}
            />
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
