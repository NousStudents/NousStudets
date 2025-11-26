import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Loader2, X, FileText } from "lucide-react";

interface SubmitAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  studentId: string;
  onSubmitSuccess: () => void;
}

export function SubmitAssignmentDialog({
  open,
  onOpenChange,
  assignmentId,
  studentId,
  onSubmitSuccess,
}: SubmitAssignmentDialogProps) {
  const [submissionText, setSubmissionText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!file) return null;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${studentId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("assignment-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("assignment-files")
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!submissionText.trim() && !file) {
      toast.error("Please add submission text or upload a file");
      return;
    }

    setSubmitting(true);
    try {
      let fileUrl = null;
      if (file) {
        setUploading(true);
        fileUrl = await uploadFile();
        setUploading(false);
      }

      const { error } = await supabase.from("submissions").insert({
        assignment_id: assignmentId,
        student_id: studentId,
        submission_text: submissionText.trim() || null,
        submission_file: fileUrl,
        submitted_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("Assignment submitted successfully");
      setSubmissionText("");
      setFile(null);
      onOpenChange(false);
      onSubmitSuccess();
    } catch (error) {
      console.error("Error submitting assignment:", error);
      toast.error("Failed to submit assignment");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Assignment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="submissionText">Your Answer</Label>
            <Textarea
              id="submissionText"
              placeholder="Type your answer here or upload a file..."
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label>Attach File (Optional)</Label>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="submission-file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
              />
              <label htmlFor="submission-file" className="flex-1">
                <Button type="button" variant="outline" className="w-full" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {file ? file.name : "Choose File"}
                  </span>
                </Button>
              </label>
              {file && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>{(file.size / 1024).toFixed(2)} KB</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || uploading}>
            {submitting || uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {uploading ? "Uploading..." : "Submitting..."}
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}