-- Enhance messages table for group chats and file sharing
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS conversation_id uuid,
ADD COLUMN IF NOT EXISTS is_group boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS group_name text,
ADD COLUMN IF NOT EXISTS file_url text,
ADD COLUMN IF NOT EXISTS file_name text,
ADD COLUMN IF NOT EXISTS file_type text,
ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text';

-- Create conversation_participants table for group chats
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  last_read_at timestamptz,
  UNIQUE(conversation_id, user_id)
);

-- Create meetings table
CREATE TABLE IF NOT EXISTS public.meetings (
  meeting_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  school_id uuid REFERENCES public.schools(school_id) NOT NULL,
  organizer_id uuid NOT NULL,
  meeting_url text,
  meeting_type text DEFAULT 'video',
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create meeting_participants table
CREATE TABLE IF NOT EXISTS public.meeting_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid REFERENCES public.meetings(meeting_id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role text DEFAULT 'participant',
  status text DEFAULT 'invited',
  joined_at timestamptz,
  UNIQUE(meeting_id, user_id)
);

-- Enable RLS
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_participants
CREATE POLICY "Users can view their own conversations"
ON public.conversation_participants
FOR SELECT
USING (user_id IN (SELECT COALESCE(get_teacher_id(), get_student_id(), get_parent_id(), get_admin_id())));

CREATE POLICY "Users can join conversations"
ON public.conversation_participants
FOR INSERT
WITH CHECK (user_id IN (SELECT COALESCE(get_teacher_id(), get_student_id(), get_parent_id(), get_admin_id())));

-- RLS Policies for meetings
CREATE POLICY "Users can view meetings they organize or participate in"
ON public.meetings
FOR SELECT
USING (
  organizer_id IN (SELECT COALESCE(get_teacher_id(), get_student_id(), get_parent_id(), get_admin_id()))
  OR meeting_id IN (
    SELECT meeting_id FROM public.meeting_participants 
    WHERE user_id IN (SELECT COALESCE(get_teacher_id(), get_student_id(), get_parent_id(), get_admin_id()))
  )
);

CREATE POLICY "Authenticated users can create meetings"
ON public.meetings
FOR INSERT
WITH CHECK (organizer_id IN (SELECT COALESCE(get_teacher_id(), get_student_id(), get_parent_id(), get_admin_id())));

CREATE POLICY "Organizers can update their meetings"
ON public.meetings
FOR UPDATE
USING (organizer_id IN (SELECT COALESCE(get_teacher_id(), get_student_id(), get_parent_id(), get_admin_id())));

-- RLS Policies for meeting_participants
CREATE POLICY "Users can view meeting participants"
ON public.meeting_participants
FOR SELECT
USING (
  meeting_id IN (
    SELECT meeting_id FROM public.meetings 
    WHERE organizer_id IN (SELECT COALESCE(get_teacher_id(), get_student_id(), get_parent_id(), get_admin_id()))
    OR meeting_id IN (
      SELECT meeting_id FROM public.meeting_participants 
      WHERE user_id IN (SELECT COALESCE(get_teacher_id(), get_student_id(), get_parent_id(), get_admin_id()))
    )
  )
);

CREATE POLICY "Organizers can add participants"
ON public.meeting_participants
FOR INSERT
WITH CHECK (
  meeting_id IN (
    SELECT meeting_id FROM public.meetings 
    WHERE organizer_id IN (SELECT COALESCE(get_teacher_id(), get_student_id(), get_parent_id(), get_admin_id()))
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meeting_participants;