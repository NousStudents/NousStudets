import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface FileUploadButtonProps {
  onFileUploaded: (fileUrl: string, fileName: string, fileType: string) => void;
}

export function FileUploadButton({ onFileUploaded }: FileUploadButtonProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("message-files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("message-files")
        .getPublicUrl(fileName);

      onFileUploaded(publicUrl, file.name, file.type);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      <label htmlFor="file-upload">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={uploading}
          asChild
        >
          <span className="cursor-pointer">
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Paperclip className="w-4 h-4" />
            )}
          </span>
        </Button>
      </label>
    </>
  );
}
