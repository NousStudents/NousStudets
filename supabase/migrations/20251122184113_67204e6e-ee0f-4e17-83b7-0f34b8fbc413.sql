-- Create chat_requests table for student-to-student permission flow
CREATE TABLE IF NOT EXISTS public.chat_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(sender_id, receiver_id, school_id)
);

-- Create user_status table for online/offline indicators
CREATE TABLE IF NOT EXISTS public.user_status (
  user_id UUID PRIMARY KEY,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create typing_indicators table
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.chat_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_requests
CREATE POLICY "Users can view their own chat requests"
  ON public.chat_requests FOR SELECT
  USING (auth.uid() IN (
    SELECT auth_user_id FROM public.admins WHERE admin_id = sender_id OR admin_id = receiver_id
    UNION
    SELECT auth_user_id FROM public.teachers WHERE teacher_id = sender_id OR teacher_id = receiver_id
    UNION
    SELECT auth_user_id FROM public.students WHERE student_id = sender_id OR student_id = receiver_id
  ));

CREATE POLICY "Students can create chat requests"
  ON public.chat_requests FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT auth_user_id FROM public.students WHERE student_id = sender_id
  ));

CREATE POLICY "Users can update their received requests"
  ON public.chat_requests FOR UPDATE
  USING (auth.uid() IN (
    SELECT auth_user_id FROM public.students WHERE student_id = receiver_id
  ));

-- RLS policies for user_status
CREATE POLICY "Anyone can view user status"
  ON public.user_status FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own status"
  ON public.user_status FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can modify their own status"
  ON public.user_status FOR UPDATE
  USING (true);

-- RLS policies for typing_indicators
CREATE POLICY "Anyone can view typing indicators"
  ON public.typing_indicators FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their typing indicators"
  ON public.typing_indicators FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their typing indicators"
  ON public.typing_indicators FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their typing indicators"
  ON public.typing_indicators FOR DELETE
  USING (true);

-- Add indexes for performance
CREATE INDEX idx_chat_requests_sender ON public.chat_requests(sender_id);
CREATE INDEX idx_chat_requests_receiver ON public.chat_requests(receiver_id);
CREATE INDEX idx_chat_requests_status ON public.chat_requests(status);
CREATE INDEX idx_user_status_online ON public.user_status(is_online);
CREATE INDEX idx_typing_indicators_conversation ON public.typing_indicators(conversation_id);

-- Enable realtime for new chat-related tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;

-- Function to automatically clean up old typing indicators
CREATE OR REPLACE FUNCTION cleanup_old_typing_indicators()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.typing_indicators
  WHERE updated_at < now() - interval '10 seconds';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cleanup_typing_indicators_trigger
  AFTER INSERT OR UPDATE ON public.typing_indicators
  EXECUTE FUNCTION cleanup_old_typing_indicators();