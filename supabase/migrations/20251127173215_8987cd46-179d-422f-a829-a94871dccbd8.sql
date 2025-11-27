-- AI Study Sessions table
CREATE TABLE ai_study_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('summary', 'quiz', 'flashcard', 'doubt', 'explanation')),
  input_content TEXT,
  ai_response TEXT,
  subject_id UUID REFERENCES subjects(subject_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- AI Homework Help table
CREATE TABLE ai_homework_help (
  help_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  help_type TEXT NOT NULL CHECK (help_type IN ('mistake_detection', 'hint', 'grammar', 'sample_answer', 'worksheet')),
  homework_content TEXT,
  ai_feedback TEXT,
  subject_id UUID REFERENCES subjects(subject_id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_student_homework FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- AI Performance Predictions table
CREATE TABLE ai_performance_predictions (
  prediction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  prediction_date DATE DEFAULT CURRENT_DATE,
  attendance_score DECIMAL,
  marks_score DECIMAL,
  assignment_score DECIMAL,
  behavior_score DECIMAL,
  overall_risk_level TEXT CHECK (overall_risk_level IN ('low', 'medium', 'high')),
  weak_subjects JSONB,
  recommendations TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_student_prediction FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- AI Study Schedules table
CREATE TABLE ai_study_schedules (
  schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  subject_id UUID REFERENCES subjects(subject_id),
  scheduled_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  priority_level TEXT CHECK (priority_level IN ('high', 'medium', 'low')),
  completed BOOLEAN DEFAULT FALSE,
  reminder_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_student_schedule FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- AI Learning Paths table
CREATE TABLE ai_learning_paths (
  path_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  subject_id UUID REFERENCES subjects(subject_id),
  current_level TEXT,
  target_level TEXT,
  milestones JSONB,
  progress_percentage DECIMAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_student_learning FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE ai_study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_homework_help ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_performance_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_study_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_learning_paths ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_study_sessions
CREATE POLICY "Students can view their own study sessions"
  ON ai_study_sessions FOR SELECT
  USING (student_id = get_student_id());

CREATE POLICY "Students can create their own study sessions"
  ON ai_study_sessions FOR INSERT
  WITH CHECK (student_id = get_student_id());

-- RLS Policies for ai_homework_help
CREATE POLICY "Students can view their own homework help"
  ON ai_homework_help FOR SELECT
  USING (student_id = get_student_id());

CREATE POLICY "Students can create their own homework help"
  ON ai_homework_help FOR INSERT
  WITH CHECK (student_id = get_student_id());

-- RLS Policies for ai_performance_predictions
CREATE POLICY "Students can view their own predictions"
  ON ai_performance_predictions FOR SELECT
  USING (student_id = get_student_id());

CREATE POLICY "System can create predictions"
  ON ai_performance_predictions FOR INSERT
  WITH CHECK (true);

-- RLS Policies for ai_study_schedules
CREATE POLICY "Students can view their own schedules"
  ON ai_study_schedules FOR SELECT
  USING (student_id = get_student_id());

CREATE POLICY "Students can manage their own schedules"
  ON ai_study_schedules FOR ALL
  USING (student_id = get_student_id());

-- RLS Policies for ai_learning_paths
CREATE POLICY "Students can view their own learning paths"
  ON ai_learning_paths FOR SELECT
  USING (student_id = get_student_id());

CREATE POLICY "Students can update their own learning paths"
  ON ai_learning_paths FOR UPDATE
  USING (student_id = get_student_id());

CREATE POLICY "System can create learning paths"
  ON ai_learning_paths FOR INSERT
  WITH CHECK (true);