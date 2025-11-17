-- Create storage bucket for message files
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-files', 'message-files', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for message files
CREATE POLICY "Users can upload message files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'message-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view message files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'message-files' AND
  (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM messages m
      WHERE m.file_url = storage.objects.name
      AND (m.sender_id::text = auth.uid()::text OR m.receiver_id::text = auth.uid()::text)
    )
  )
);

-- Add RLS policy for viewing messages
CREATE POLICY "Users can view their messages"
ON messages
FOR SELECT
USING (
  sender_id IN (
    SELECT COALESCE(get_teacher_id(), get_student_id(), get_parent_id(), get_admin_id())
  ) OR
  receiver_id IN (
    SELECT COALESCE(get_teacher_id(), get_student_id(), get_parent_id(), get_admin_id())
  ) OR
  (is_group = true AND conversation_id IN (
    SELECT conversation_id FROM conversation_participants
    WHERE user_id IN (
      SELECT COALESCE(get_teacher_id(), get_student_id(), get_parent_id(), get_admin_id())
    )
  ))
);