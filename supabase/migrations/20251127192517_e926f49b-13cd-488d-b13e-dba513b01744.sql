-- Admin AI Insights table for dashboard predictions
CREATE TABLE IF NOT EXISTS public.admin_ai_insights (
  insight_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id),
  insight_type TEXT NOT NULL, -- 'attendance', 'academics', 'fee_collection', 'class_performance', 'financial_patterns', 'risk_alerts'
  insight_data JSONB NOT NULL,
  predictions JSONB,
  recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  generated_by UUID,
  expires_at TIMESTAMPTZ
);

-- Smart Notifications table
CREATE TABLE IF NOT EXISTS public.smart_notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id),
  recipient_id UUID NOT NULL,
  recipient_type TEXT NOT NULL, -- 'student', 'teacher', 'parent', 'admin'
  notification_type TEXT NOT NULL, -- 'reminder', 'alert', 'suggestion', 'insight', 'academic'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  metadata JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ,
  action_url TEXT
);

-- AI Chatbot Conversations table
CREATE TABLE IF NOT EXISTS public.ai_chatbot_conversations (
  conversation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL, -- 'student', 'teacher', 'parent', 'admin'
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Voice Commands table
CREATE TABLE IF NOT EXISTS public.voice_commands (
  command_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL,
  command_text TEXT NOT NULL,
  command_type TEXT, -- 'timetable', 'attendance', 'fee_report', 'general'
  response TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fee Predictions table
CREATE TABLE IF NOT EXISTS public.fee_predictions (
  prediction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id),
  prediction_date DATE DEFAULT CURRENT_DATE,
  total_expected NUMERIC,
  total_collected NUMERIC,
  total_pending NUMERIC,
  predictions JSONB,
  unusual_activities JSONB,
  recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Teacher Performance Analytics table
CREATE TABLE IF NOT EXISTS public.teacher_performance_analytics (
  analytics_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(school_id),
  teacher_id UUID NOT NULL REFERENCES public.teachers(teacher_id),
  analysis_period TEXT, -- 'weekly', 'monthly', 'quarterly', 'yearly'
  class_results_avg NUMERIC,
  student_improvement_rate NUMERIC,
  attendance_rate NUMERIC,
  assignment_completion_rate NUMERIC,
  feedback_score NUMERIC,
  strengths TEXT[],
  areas_for_improvement TEXT[],
  recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chatbot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_performance_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_ai_insights
CREATE POLICY "Admins can view their school insights"
  ON public.admin_ai_insights FOR SELECT
  TO authenticated
  USING (has_role('admin') AND school_id = current_school_id());

CREATE POLICY "System can insert insights"
  ON public.admin_ai_insights FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin') AND school_id = current_school_id());

-- RLS Policies for smart_notifications
CREATE POLICY "Users can view their own notifications"
  ON public.smart_notifications FOR SELECT
  TO authenticated
  USING (
    recipient_id IN (
      SELECT COALESCE(get_admin_id(), get_teacher_id(), get_student_id(), get_parent_id())
    )
  );

CREATE POLICY "Users can update their own notifications"
  ON public.smart_notifications FOR UPDATE
  TO authenticated
  USING (
    recipient_id IN (
      SELECT COALESCE(get_admin_id(), get_teacher_id(), get_student_id(), get_parent_id())
    )
  );

CREATE POLICY "System can insert notifications"
  ON public.smart_notifications FOR INSERT
  TO authenticated
  WITH CHECK (school_id = current_school_id());

-- RLS Policies for ai_chatbot_conversations
CREATE POLICY "Users can view their own conversations"
  ON public.ai_chatbot_conversations FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT COALESCE(get_admin_id(), get_teacher_id(), get_student_id(), get_parent_id())
    )
  );

CREATE POLICY "Users can manage their own conversations"
  ON public.ai_chatbot_conversations FOR ALL
  TO authenticated
  USING (
    user_id IN (
      SELECT COALESCE(get_admin_id(), get_teacher_id(), get_student_id(), get_parent_id())
    )
  );

-- RLS Policies for voice_commands
CREATE POLICY "Users can view their own voice commands"
  ON public.voice_commands FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT COALESCE(get_admin_id(), get_teacher_id(), get_student_id(), get_parent_id())
    )
  );

CREATE POLICY "Users can insert their own voice commands"
  ON public.voice_commands FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (
      SELECT COALESCE(get_admin_id(), get_teacher_id(), get_student_id(), get_parent_id())
    )
  );

-- RLS Policies for fee_predictions
CREATE POLICY "Admins can view fee predictions"
  ON public.fee_predictions FOR SELECT
  TO authenticated
  USING (has_role('admin') AND school_id = current_school_id());

CREATE POLICY "System can insert fee predictions"
  ON public.fee_predictions FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin') AND school_id = current_school_id());

-- RLS Policies for teacher_performance_analytics
CREATE POLICY "Admins can view all teacher analytics"
  ON public.teacher_performance_analytics FOR SELECT
  TO authenticated
  USING (has_role('admin') AND school_id = current_school_id());

CREATE POLICY "Teachers can view their own analytics"
  ON public.teacher_performance_analytics FOR SELECT
  TO authenticated
  USING (has_role('teacher') AND teacher_id = get_teacher_id());

CREATE POLICY "System can insert teacher analytics"
  ON public.teacher_performance_analytics FOR INSERT
  TO authenticated
  WITH CHECK (has_role('admin') AND school_id = current_school_id());

-- Indexes for performance
CREATE INDEX idx_admin_ai_insights_school ON public.admin_ai_insights(school_id);
CREATE INDEX idx_smart_notifications_recipient ON public.smart_notifications(recipient_id);
CREATE INDEX idx_ai_chatbot_user ON public.ai_chatbot_conversations(user_id);
CREATE INDEX idx_voice_commands_user ON public.voice_commands(user_id);
CREATE INDEX idx_fee_predictions_school ON public.fee_predictions(school_id);
CREATE INDEX idx_teacher_analytics_teacher ON public.teacher_performance_analytics(teacher_id);