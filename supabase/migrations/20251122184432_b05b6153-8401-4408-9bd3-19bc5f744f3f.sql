-- Create conversations table for group chats
CREATE TABLE IF NOT EXISTS public.conversations (
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_group BOOLEAN DEFAULT true,
  avatar_url TEXT,
  school_id UUID NOT NULL REFERENCES public.schools(school_id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations
CREATE POLICY "Anyone can view conversations they're part of"
  ON public.conversations FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversation_participants 
      WHERE user_id IN (
        SELECT COALESCE(get_admin_id(), get_teacher_id(), get_student_id(), get_parent_id())
      )
    )
  );

CREATE POLICY "Teachers and admins can create groups"
  ON public.conversations FOR INSERT
  WITH CHECK (
    (has_role('admin') OR has_role('teacher')) AND
    school_id = current_school_id() AND
    created_by IN (
      SELECT COALESCE(get_admin_id(), get_teacher_id())
    )
  );

CREATE POLICY "Creators can update their groups"
  ON public.conversations FOR UPDATE
  USING (
    created_by IN (
      SELECT COALESCE(get_admin_id(), get_teacher_id())
    )
  );

-- Update conversation_participants with better policies
DROP POLICY IF EXISTS "Users can join conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversation_participants;

CREATE POLICY "Group creators can add participants"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversations 
      WHERE created_by IN (
        SELECT COALESCE(get_admin_id(), get_teacher_id())
      )
    )
  );

CREATE POLICY "Users can view participants in their conversations"
  ON public.conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT cp.conversation_id 
      FROM public.conversation_participants cp
      WHERE cp.user_id IN (
        SELECT COALESCE(get_admin_id(), get_teacher_id(), get_student_id(), get_parent_id())
      )
    )
  );

CREATE POLICY "Group creators can remove participants"
  ON public.conversation_participants FOR DELETE
  USING (
    conversation_id IN (
      SELECT conversation_id 
      FROM public.conversations 
      WHERE created_by IN (
        SELECT COALESCE(get_admin_id(), get_teacher_id())
      )
    )
  );

-- Add indexes for performance
CREATE INDEX idx_conversations_school ON public.conversations(school_id);
CREATE INDEX idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX idx_conversation_participants_user ON public.conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conv ON public.conversation_participants(conversation_id);

-- Enable realtime for conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;