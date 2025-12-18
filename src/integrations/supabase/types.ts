export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_id: string
          activity_type: string
          actor_id: string | null
          actor_name: string | null
          actor_role: string | null
          created_at: string | null
          description: string | null
          metadata: Json | null
          school_id: string
          target_class_id: string | null
          target_subject_id: string | null
          target_user_id: string | null
          title: string
        }
        Insert: {
          activity_id?: string
          activity_type: string
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: string | null
          created_at?: string | null
          description?: string | null
          metadata?: Json | null
          school_id: string
          target_class_id?: string | null
          target_subject_id?: string | null
          target_user_id?: string | null
          title: string
        }
        Update: {
          activity_id?: string
          activity_type?: string
          actor_id?: string | null
          actor_name?: string | null
          actor_role?: string | null
          created_at?: string | null
          description?: string | null
          metadata?: Json | null
          school_id?: string
          target_class_id?: string | null
          target_subject_id?: string | null
          target_user_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      admin_ai_insights: {
        Row: {
          created_at: string | null
          expires_at: string | null
          generated_by: string | null
          insight_data: Json
          insight_id: string
          insight_type: string
          predictions: Json | null
          recommendations: string | null
          school_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          generated_by?: string | null
          insight_data: Json
          insight_id?: string
          insight_type: string
          predictions?: Json | null
          recommendations?: string | null
          school_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          generated_by?: string | null
          insight_data?: Json
          insight_id?: string
          insight_type?: string
          predictions?: Json | null
          recommendations?: string | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_ai_insights_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      admins: {
        Row: {
          admin_id: string
          admin_level: string | null
          auth_user_id: string
          created_at: string | null
          department: string | null
          email: string
          full_name: string
          permissions: Json | null
          phone: string | null
          profile_image: string | null
          school_id: string
          status: string | null
        }
        Insert: {
          admin_id?: string
          admin_level?: string | null
          auth_user_id: string
          created_at?: string | null
          department?: string | null
          email: string
          full_name: string
          permissions?: Json | null
          phone?: string | null
          profile_image?: string | null
          school_id: string
          status?: string | null
        }
        Update: {
          admin_id?: string
          admin_level?: string | null
          auth_user_id?: string
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string
          permissions?: Json | null
          phone?: string | null
          profile_image?: string | null
          school_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admins_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      ai_attendance_analysis: {
        Row: {
          analysis_date: string | null
          analysis_id: string
          class_id: string
          created_at: string | null
          frequent_absentees: Json | null
          insights: string | null
          predicted_dropouts: Json | null
          recommendations: string | null
          teacher_id: string
        }
        Insert: {
          analysis_date?: string | null
          analysis_id?: string
          class_id: string
          created_at?: string | null
          frequent_absentees?: Json | null
          insights?: string | null
          predicted_dropouts?: Json | null
          recommendations?: string | null
          teacher_id: string
        }
        Update: {
          analysis_date?: string | null
          analysis_id?: string
          class_id?: string
          created_at?: string | null
          frequent_absentees?: Json | null
          insights?: string | null
          predicted_dropouts?: Json | null
          recommendations?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_attendance_analysis_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "ai_attendance_analysis_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      ai_chatbot_conversations: {
        Row: {
          context: Json | null
          conversation_id: string
          created_at: string | null
          messages: Json
          school_id: string
          updated_at: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          context?: Json | null
          conversation_id?: string
          created_at?: string | null
          messages?: Json
          school_id: string
          updated_at?: string | null
          user_id: string
          user_type: string
        }
        Update: {
          context?: Json | null
          conversation_id?: string
          created_at?: string | null
          messages?: Json
          school_id?: string
          updated_at?: string | null
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chatbot_conversations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      ai_generated_assignments: {
        Row: {
          answer_key: Json | null
          assignment_type: string
          auto_gradable: boolean | null
          class_id: string | null
          created_at: string | null
          difficulty_level: string | null
          generated_id: string
          max_marks: number | null
          questions: Json
          subject_id: string | null
          teacher_id: string
          topic: string
        }
        Insert: {
          answer_key?: Json | null
          assignment_type: string
          auto_gradable?: boolean | null
          class_id?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          generated_id?: string
          max_marks?: number | null
          questions: Json
          subject_id?: string | null
          teacher_id: string
          topic: string
        }
        Update: {
          answer_key?: Json | null
          assignment_type?: string
          auto_gradable?: boolean | null
          class_id?: string | null
          created_at?: string | null
          difficulty_level?: string | null
          generated_id?: string
          max_marks?: number | null
          questions?: Json
          subject_id?: string | null
          teacher_id?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generated_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "ai_generated_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "ai_generated_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      ai_homework_help: {
        Row: {
          ai_feedback: string | null
          created_at: string | null
          help_id: string
          help_type: string
          homework_content: string | null
          student_id: string
          subject_id: string | null
        }
        Insert: {
          ai_feedback?: string | null
          created_at?: string | null
          help_id?: string
          help_type: string
          homework_content?: string | null
          student_id: string
          subject_id?: string | null
        }
        Update: {
          ai_feedback?: string | null
          created_at?: string | null
          help_id?: string
          help_type?: string
          homework_content?: string | null
          student_id?: string
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_homework_help_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "fk_student_homework"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      ai_learning_paths: {
        Row: {
          created_at: string | null
          current_level: string | null
          milestones: Json | null
          path_id: string
          progress_percentage: number | null
          student_id: string
          subject_id: string | null
          target_level: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_level?: string | null
          milestones?: Json | null
          path_id?: string
          progress_percentage?: number | null
          student_id: string
          subject_id?: string | null
          target_level?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_level?: string | null
          milestones?: Json | null
          path_id?: string
          progress_percentage?: number | null
          student_id?: string
          subject_id?: string | null
          target_level?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_learning_paths_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "fk_student_learning"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      ai_lesson_plans: {
        Row: {
          activities: Json | null
          class_id: string | null
          created_at: string | null
          duration_minutes: number | null
          examples: Json | null
          grade_level: string | null
          is_edited: boolean | null
          learning_outcomes: Json | null
          lesson_content: Json
          plan_id: string
          resources: string[] | null
          subject_id: string | null
          teacher_id: string
          teaching_steps: Json | null
          topic: string
          updated_at: string | null
        }
        Insert: {
          activities?: Json | null
          class_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          examples?: Json | null
          grade_level?: string | null
          is_edited?: boolean | null
          learning_outcomes?: Json | null
          lesson_content: Json
          plan_id?: string
          resources?: string[] | null
          subject_id?: string | null
          teacher_id: string
          teaching_steps?: Json | null
          topic: string
          updated_at?: string | null
        }
        Update: {
          activities?: Json | null
          class_id?: string | null
          created_at?: string | null
          duration_minutes?: number | null
          examples?: Json | null
          grade_level?: string | null
          is_edited?: boolean | null
          learning_outcomes?: Json | null
          lesson_content?: Json
          plan_id?: string
          resources?: string[] | null
          subject_id?: string | null
          teacher_id?: string
          teaching_steps?: Json | null
          topic?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_lesson_plans_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "ai_lesson_plans_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "ai_lesson_plans_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      ai_performance_predictions: {
        Row: {
          assignment_score: number | null
          attendance_score: number | null
          behavior_score: number | null
          created_at: string | null
          marks_score: number | null
          overall_risk_level: string | null
          prediction_date: string | null
          prediction_id: string
          recommendations: string | null
          student_id: string
          weak_subjects: Json | null
        }
        Insert: {
          assignment_score?: number | null
          attendance_score?: number | null
          behavior_score?: number | null
          created_at?: string | null
          marks_score?: number | null
          overall_risk_level?: string | null
          prediction_date?: string | null
          prediction_id?: string
          recommendations?: string | null
          student_id: string
          weak_subjects?: Json | null
        }
        Update: {
          assignment_score?: number | null
          attendance_score?: number | null
          behavior_score?: number | null
          created_at?: string | null
          marks_score?: number | null
          overall_risk_level?: string | null
          prediction_date?: string | null
          prediction_id?: string
          recommendations?: string | null
          student_id?: string
          weak_subjects?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_student_prediction"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      ai_report_comments: {
        Row: {
          areas_for_improvement: string[] | null
          attendance_remarks: string | null
          behavior_remarks: string | null
          comment_id: string
          comment_text: string
          created_at: string | null
          exam_id: string | null
          is_edited: boolean | null
          performance_summary: string | null
          strengths: string[] | null
          student_id: string
          subject_id: string | null
          teacher_id: string
        }
        Insert: {
          areas_for_improvement?: string[] | null
          attendance_remarks?: string | null
          behavior_remarks?: string | null
          comment_id?: string
          comment_text: string
          created_at?: string | null
          exam_id?: string | null
          is_edited?: boolean | null
          performance_summary?: string | null
          strengths?: string[] | null
          student_id: string
          subject_id?: string | null
          teacher_id: string
        }
        Update: {
          areas_for_improvement?: string[] | null
          attendance_remarks?: string | null
          behavior_remarks?: string | null
          comment_id?: string
          comment_text?: string
          created_at?: string | null
          exam_id?: string | null
          is_edited?: boolean | null
          performance_summary?: string | null
          strengths?: string[] | null
          student_id?: string
          subject_id?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_report_comments_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["exam_id"]
          },
          {
            foreignKeyName: "ai_report_comments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "ai_report_comments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "ai_report_comments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      ai_study_schedules: {
        Row: {
          completed: boolean | null
          created_at: string | null
          duration_minutes: number | null
          priority_level: string | null
          reminder_sent: boolean | null
          schedule_id: string
          scheduled_time: string | null
          student_id: string
          subject_id: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          duration_minutes?: number | null
          priority_level?: string | null
          reminder_sent?: boolean | null
          schedule_id?: string
          scheduled_time?: string | null
          student_id: string
          subject_id?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          duration_minutes?: number | null
          priority_level?: string | null
          reminder_sent?: boolean | null
          schedule_id?: string
          scheduled_time?: string | null
          student_id?: string
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_study_schedules_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "fk_student_schedule"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      ai_study_sessions: {
        Row: {
          ai_response: string | null
          created_at: string | null
          input_content: string | null
          session_id: string
          session_type: string
          student_id: string
          subject_id: string | null
        }
        Insert: {
          ai_response?: string | null
          created_at?: string | null
          input_content?: string | null
          session_id?: string
          session_type: string
          student_id: string
          subject_id?: string | null
        }
        Update: {
          ai_response?: string | null
          created_at?: string | null
          input_content?: string | null
          session_id?: string
          session_type?: string
          student_id?: string
          subject_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_study_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_id"]
          },
          {
            foreignKeyName: "fk_student"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      ai_tools: {
        Row: {
          ai_id: string
          created_at: string | null
          feature_type: string | null
          input_content: string | null
          input_type: string | null
          result_url: string | null
          user_id: string
        }
        Insert: {
          ai_id?: string
          created_at?: string | null
          feature_type?: string | null
          input_content?: string | null
          input_type?: string | null
          result_url?: string | null
          user_id: string
        }
        Update: {
          ai_id?: string
          created_at?: string | null
          feature_type?: string | null
          input_content?: string | null
          input_type?: string | null
          result_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      allowed_students: {
        Row: {
          class_id: string | null
          created_at: string | null
          created_by: string | null
          email: string
          full_name: string
          id: string
          roll_no: string | null
          school_id: string
          section: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email: string
          full_name: string
          id?: string
          roll_no?: string | null
          school_id: string
          section?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          roll_no?: string | null
          school_id?: string
          section?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "allowed_students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "allowed_students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      assignment_students: {
        Row: {
          assignment_id: string
          created_at: string | null
          id: string
          student_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          id?: string
          student_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_students_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["assignment_id"]
          },
          {
            foreignKeyName: "assignment_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      assignments: {
        Row: {
          assignment_id: string
          class_id: string
          created_at: string | null
          description: string | null
          due_date: string | null
          file_url: string | null
          max_marks: number | null
          subject_id: string
          teacher_id: string
          title: string
        }
        Insert: {
          assignment_id?: string
          class_id: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          max_marks?: number | null
          subject_id: string
          teacher_id: string
          title: string
        }
        Update: {
          assignment_id?: string
          class_id?: string
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          file_url?: string | null
          max_marks?: number | null
          subject_id?: string
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_id"]
          },
        ]
      }
      attendance: {
        Row: {
          attendance_id: string
          class_id: string
          created_at: string | null
          date: string
          marked_by: string | null
          status: string | null
          student_id: string
        }
        Insert: {
          attendance_id?: string
          class_id: string
          created_at?: string | null
          date: string
          marked_by?: string | null
          status?: string | null
          student_id: string
        }
        Update: {
          attendance_id?: string
          class_id?: string
          created_at?: string | null
          date?: string
          marked_by?: string | null
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          log_id: string
          performed_by: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          log_id?: string
          performed_by: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          log_id?: string
          performed_by?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      chat_requests: {
        Row: {
          created_at: string | null
          receiver_id: string
          request_id: string
          school_id: string
          sender_id: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          receiver_id: string
          request_id?: string
          school_id: string
          sender_id: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          receiver_id?: string
          request_id?: string
          school_id?: string
          sender_id?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_requests_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      class_announcements: {
        Row: {
          announcement_id: string
          class_id: string
          content: string
          created_at: string | null
          school_id: string
          teacher_id: string
          title: string
        }
        Insert: {
          announcement_id?: string
          class_id: string
          content: string
          created_at?: string | null
          school_id: string
          teacher_id: string
          title: string
        }
        Update: {
          announcement_id?: string
          class_id?: string
          content?: string
          created_at?: string | null
          school_id?: string
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_announcements_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "class_announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "class_announcements_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      classes: {
        Row: {
          class_id: string
          class_name: string
          class_teacher_id: string | null
          created_at: string | null
          school_id: string
          section: string | null
        }
        Insert: {
          class_id?: string
          class_name: string
          class_teacher_id?: string | null
          created_at?: string | null
          school_id: string
          section?: string | null
        }
        Update: {
          class_id?: string
          class_name?: string
          class_teacher_id?: string | null
          created_at?: string | null
          school_id?: string
          section?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_class_teacher_id_fkey"
            columns: ["class_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string | null
          last_read_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          avatar_url: string | null
          conversation_id: string
          created_at: string | null
          created_by: string
          description: string | null
          is_group: boolean | null
          name: string
          school_id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          conversation_id?: string
          created_at?: string | null
          created_by: string
          description?: string | null
          is_group?: boolean | null
          name: string
          school_id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          conversation_id?: string
          created_at?: string | null
          created_by?: string
          description?: string | null
          is_group?: boolean | null
          name?: string
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          description: string | null
          event_date: string
          event_id: string
          event_name: string
          school_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_date: string
          event_id?: string
          event_name: string
          school_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_date?: string
          event_id?: string
          event_name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      exam_results: {
        Row: {
          created_at: string | null
          exam_id: string
          grade: string | null
          marks_obtained: number | null
          max_marks: number | null
          remarks: string | null
          result_id: string
          student_id: string
          subject_id: string
        }
        Insert: {
          created_at?: string | null
          exam_id: string
          grade?: string | null
          marks_obtained?: number | null
          max_marks?: number | null
          remarks?: string | null
          result_id?: string
          student_id: string
          subject_id: string
        }
        Update: {
          created_at?: string | null
          exam_id?: string
          grade?: string | null
          marks_obtained?: number | null
          max_marks?: number | null
          remarks?: string | null
          result_id?: string
          student_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["exam_id"]
          },
          {
            foreignKeyName: "exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
          {
            foreignKeyName: "exam_results_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_id"]
          },
        ]
      }
      exam_timetable: {
        Row: {
          created_at: string | null
          end_time: string
          exam_date: string
          exam_id: string
          room_no: string | null
          start_time: string
          subject_id: string
          timetable_id: string
        }
        Insert: {
          created_at?: string | null
          end_time: string
          exam_date: string
          exam_id: string
          room_no?: string | null
          start_time: string
          subject_id: string
          timetable_id?: string
        }
        Update: {
          created_at?: string | null
          end_time?: string
          exam_date?: string
          exam_id?: string
          room_no?: string | null
          start_time?: string
          subject_id?: string
          timetable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_timetable_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["exam_id"]
          },
          {
            foreignKeyName: "exam_timetable_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_id"]
          },
        ]
      }
      exams: {
        Row: {
          class_id: string
          created_at: string | null
          end_date: string | null
          exam_id: string
          exam_name: string
          school_id: string
          start_date: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          end_date?: string | null
          exam_id?: string
          exam_name: string
          school_id: string
          start_date?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          end_date?: string | null
          exam_id?: string
          exam_name?: string
          school_id?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "exams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      fee_predictions: {
        Row: {
          created_at: string | null
          prediction_date: string | null
          prediction_id: string
          predictions: Json | null
          recommendations: string | null
          school_id: string
          total_collected: number | null
          total_expected: number | null
          total_pending: number | null
          unusual_activities: Json | null
        }
        Insert: {
          created_at?: string | null
          prediction_date?: string | null
          prediction_id?: string
          predictions?: Json | null
          recommendations?: string | null
          school_id: string
          total_collected?: number | null
          total_expected?: number | null
          total_pending?: number | null
          unusual_activities?: Json | null
        }
        Update: {
          created_at?: string | null
          prediction_date?: string | null
          prediction_id?: string
          predictions?: Json | null
          recommendations?: string | null
          school_id?: string
          total_collected?: number | null
          total_expected?: number | null
          total_pending?: number | null
          unusual_activities?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_predictions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      fees: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string | null
          fee_id: string
          payment_date: string | null
          school_id: string
          status: string | null
          student_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date?: string | null
          fee_id?: string
          payment_date?: string | null
          school_id: string
          status?: string | null
          student_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string | null
          fee_id?: string
          payment_date?: string | null
          school_id?: string
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fees_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      inventory: {
        Row: {
          condition: string | null
          created_at: string | null
          item_id: string
          item_name: string
          purchase_date: string | null
          quantity: number | null
          school_id: string
        }
        Insert: {
          condition?: string | null
          created_at?: string | null
          item_id?: string
          item_name: string
          purchase_date?: string | null
          quantity?: number | null
          school_id: string
        }
        Update: {
          condition?: string | null
          created_at?: string | null
          item_id?: string
          item_name?: string
          purchase_date?: string | null
          quantity?: number | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          class_id: string
          created_at: string | null
          end_date: string
          leave_request_id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          school_id: string
          start_date: string
          status: string
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          end_date: string
          leave_request_id?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_id: string
          start_date: string
          status?: string
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          end_date?: string
          leave_request_id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_id?: string
          start_date?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "leave_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["teacher_id"]
          },
          {
            foreignKeyName: "leave_requests_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "leave_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      library_books: {
        Row: {
          author: string | null
          available_copies: number | null
          book_id: string
          created_at: string | null
          isbn: string | null
          school_id: string
          title: string
          total_copies: number | null
        }
        Insert: {
          author?: string | null
          available_copies?: number | null
          book_id?: string
          created_at?: string | null
          isbn?: string | null
          school_id: string
          title: string
          total_copies?: number | null
        }
        Update: {
          author?: string | null
          available_copies?: number | null
          book_id?: string
          created_at?: string | null
          isbn?: string | null
          school_id?: string
          title?: string
          total_copies?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "library_books_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      library_issues: {
        Row: {
          book_id: string
          created_at: string | null
          issue_date: string
          issue_id: string
          return_date: string | null
          status: string | null
          student_id: string
        }
        Insert: {
          book_id: string
          created_at?: string | null
          issue_date?: string
          issue_id?: string
          return_date?: string | null
          status?: string | null
          student_id: string
        }
        Update: {
          book_id?: string
          created_at?: string | null
          issue_date?: string
          issue_id?: string
          return_date?: string | null
          status?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_issues_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "library_books"
            referencedColumns: ["book_id"]
          },
          {
            foreignKeyName: "library_issues_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          id: string
          joined_at: string | null
          meeting_id: string
          role: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          meeting_id: string
          role?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          meeting_id?: string
          role?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["meeting_id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          meeting_id: string
          meeting_type: string | null
          meeting_url: string | null
          organizer_id: string
          scheduled_at: string
          school_id: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          meeting_id?: string
          meeting_type?: string | null
          meeting_url?: string | null
          organizer_id: string
          scheduled_at: string
          school_id: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          meeting_id?: string
          meeting_type?: string | null
          meeting_url?: string | null
          organizer_id?: string
          scheduled_at?: string
          school_id?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      messages: {
        Row: {
          conversation_id: string | null
          file_name: string | null
          file_type: string | null
          file_url: string | null
          group_name: string | null
          is_group: boolean | null
          message_id: string
          message_text: string
          message_type: string | null
          read_at: string | null
          receiver_id: string
          school_id: string
          sender_id: string
          sent_at: string | null
        }
        Insert: {
          conversation_id?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          group_name?: string | null
          is_group?: boolean | null
          message_id?: string
          message_text: string
          message_type?: string | null
          read_at?: string | null
          receiver_id: string
          school_id: string
          sender_id: string
          sent_at?: string | null
        }
        Update: {
          conversation_id?: string | null
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          group_name?: string | null
          is_group?: boolean | null
          message_id?: string
          message_text?: string
          message_type?: string | null
          read_at?: string | null
          receiver_id?: string
          school_id?: string
          sender_id?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      notifications: {
        Row: {
          message: string
          notification_id: string
          school_id: string
          sent_at: string | null
          status: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          message: string
          notification_id?: string
          school_id: string
          sent_at?: string | null
          status?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          message?: string
          notification_id?: string
          school_id?: string
          sent_at?: string | null
          status?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      parents: {
        Row: {
          auth_user_id: string
          created_at: string | null
          email: string
          full_name: string
          occupation: string | null
          parent_id: string
          phone: string | null
          profile_image: string | null
          relation: string | null
          school_id: string
          status: string | null
        }
        Insert: {
          auth_user_id: string
          created_at?: string | null
          email: string
          full_name: string
          occupation?: string | null
          parent_id?: string
          phone?: string | null
          profile_image?: string | null
          relation?: string | null
          school_id: string
          status?: string | null
        }
        Update: {
          auth_user_id?: string
          created_at?: string | null
          email?: string
          full_name?: string
          occupation?: string | null
          parent_id?: string
          phone?: string | null
          profile_image?: string | null
          relation?: string | null
          school_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      payroll: {
        Row: {
          amount: number
          created_at: string | null
          month: string
          payment_date: string | null
          payroll_id: string
          status: string | null
          teacher_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          month: string
          payment_date?: string | null
          payroll_id?: string
          status?: string | null
          teacher_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          month?: string
          payment_date?: string | null
          payroll_id?: string
          status?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      period_types: {
        Row: {
          color_code: string | null
          created_at: string | null
          period_type_id: string
          type_name: string
        }
        Insert: {
          color_code?: string | null
          created_at?: string | null
          period_type_id?: string
          type_name: string
        }
        Update: {
          color_code?: string | null
          created_at?: string | null
          period_type_id?: string
          type_name?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          phone: string | null
          school_id: string
          school_name: string
          state: string | null
          subdomain: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          phone?: string | null
          school_id?: string
          school_name: string
          state?: string | null
          subdomain?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          phone?: string | null
          school_id?: string
          school_name?: string
          state?: string | null
          subdomain?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      smart_notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_id: string
          notification_type: string
          priority: string | null
          read_at: string | null
          recipient_id: string
          recipient_type: string
          school_id: string
          title: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_id?: string
          notification_type: string
          priority?: string | null
          read_at?: string | null
          recipient_id: string
          recipient_type: string
          school_id: string
          title: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_id?: string
          notification_type?: string
          priority?: string | null
          read_at?: string | null
          recipient_id?: string
          recipient_type?: string
          school_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_notifications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      student_profile_history: {
        Row: {
          field_name: string
          history_id: string
          new_value: string | null
          old_value: string | null
          student_id: string
          updated_at: string | null
          updated_by: string
          updated_by_role: string
        }
        Insert: {
          field_name: string
          history_id?: string
          new_value?: string | null
          old_value?: string | null
          student_id: string
          updated_at?: string | null
          updated_by: string
          updated_by_role: string
        }
        Update: {
          field_name?: string
          history_id?: string
          new_value?: string | null
          old_value?: string | null
          student_id?: string
          updated_at?: string | null
          updated_by?: string
          updated_by_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profile_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      students: {
        Row: {
          aadhar_card_url: string | null
          academic_year: string | null
          achievements: string | null
          admission_date: string | null
          admission_number: string | null
          allergies: string | null
          auth_user_id: string
          birth_certificate_url: string | null
          blood_group: string | null
          class_id: string | null
          created_at: string | null
          date_of_admission: string | null
          district: string | null
          dob: string | null
          doctor_contact_number: string | null
          door_no: string | null
          email: string
          emergency_contact_mobile: string | null
          emergency_contact_name: string | null
          emergency_contact_relationship: string | null
          family_doctor_name: string | null
          father_email: string | null
          father_name: string | null
          father_occupation: string | null
          father_phone: string | null
          full_name: string
          gender: string | null
          guardian_contact: string | null
          guardian_name: string | null
          guardian_relationship: string | null
          height: number | null
          hobbies: string | null
          id_card_url: string | null
          interests: string | null
          languages_known: string | null
          medical_conditions: string | null
          medium_of_instruction: string | null
          mother_email: string | null
          mother_name: string | null
          mother_occupation: string | null
          mother_phone: string | null
          mother_tongue: string | null
          nationality: string | null
          other_documents_url: string | null
          parent_id: string | null
          phone: string | null
          previous_school: string | null
          profile_picture: string | null
          profile_updated_at: string | null
          religion: string | null
          report_cards_url: string | null
          roll_no: string | null
          section: string | null
          status: string | null
          street: string | null
          student_category: string | null
          student_email: string | null
          student_id: string
          student_phone: string | null
          transfer_certificate_url: string | null
          village_town: string | null
          weight: number | null
        }
        Insert: {
          aadhar_card_url?: string | null
          academic_year?: string | null
          achievements?: string | null
          admission_date?: string | null
          admission_number?: string | null
          allergies?: string | null
          auth_user_id: string
          birth_certificate_url?: string | null
          blood_group?: string | null
          class_id?: string | null
          created_at?: string | null
          date_of_admission?: string | null
          district?: string | null
          dob?: string | null
          doctor_contact_number?: string | null
          door_no?: string | null
          email: string
          emergency_contact_mobile?: string | null
          emergency_contact_name?: string | null
          emergency_contact_relationship?: string | null
          family_doctor_name?: string | null
          father_email?: string | null
          father_name?: string | null
          father_occupation?: string | null
          father_phone?: string | null
          full_name: string
          gender?: string | null
          guardian_contact?: string | null
          guardian_name?: string | null
          guardian_relationship?: string | null
          height?: number | null
          hobbies?: string | null
          id_card_url?: string | null
          interests?: string | null
          languages_known?: string | null
          medical_conditions?: string | null
          medium_of_instruction?: string | null
          mother_email?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          mother_phone?: string | null
          mother_tongue?: string | null
          nationality?: string | null
          other_documents_url?: string | null
          parent_id?: string | null
          phone?: string | null
          previous_school?: string | null
          profile_picture?: string | null
          profile_updated_at?: string | null
          religion?: string | null
          report_cards_url?: string | null
          roll_no?: string | null
          section?: string | null
          status?: string | null
          street?: string | null
          student_category?: string | null
          student_email?: string | null
          student_id?: string
          student_phone?: string | null
          transfer_certificate_url?: string | null
          village_town?: string | null
          weight?: number | null
        }
        Update: {
          aadhar_card_url?: string | null
          academic_year?: string | null
          achievements?: string | null
          admission_date?: string | null
          admission_number?: string | null
          allergies?: string | null
          auth_user_id?: string
          birth_certificate_url?: string | null
          blood_group?: string | null
          class_id?: string | null
          created_at?: string | null
          date_of_admission?: string | null
          district?: string | null
          dob?: string | null
          doctor_contact_number?: string | null
          door_no?: string | null
          email?: string
          emergency_contact_mobile?: string | null
          emergency_contact_name?: string | null
          emergency_contact_relationship?: string | null
          family_doctor_name?: string | null
          father_email?: string | null
          father_name?: string | null
          father_occupation?: string | null
          father_phone?: string | null
          full_name?: string
          gender?: string | null
          guardian_contact?: string | null
          guardian_name?: string | null
          guardian_relationship?: string | null
          height?: number | null
          hobbies?: string | null
          id_card_url?: string | null
          interests?: string | null
          languages_known?: string | null
          medical_conditions?: string | null
          medium_of_instruction?: string | null
          mother_email?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          mother_phone?: string | null
          mother_tongue?: string | null
          nationality?: string | null
          other_documents_url?: string | null
          parent_id?: string | null
          phone?: string | null
          previous_school?: string | null
          profile_picture?: string | null
          profile_updated_at?: string | null
          religion?: string | null
          report_cards_url?: string | null
          roll_no?: string | null
          section?: string | null
          status?: string | null
          street?: string | null
          student_category?: string | null
          student_email?: string | null
          student_id?: string
          student_phone?: string | null
          transfer_certificate_url?: string | null
          village_town?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["class_id"]
          },
        ]
      }
      subjects: {
        Row: {
          class_id: string
          created_at: string | null
          subject_id: string
          subject_name: string
          teacher_id: string | null
        }
        Insert: {
          class_id: string
          created_at?: string | null
          subject_id?: string
          subject_name: string
          teacher_id?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string | null
          subject_id?: string
          subject_name?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["class_id"]
          },
        ]
      }
      submissions: {
        Row: {
          assignment_id: string
          feedback: string | null
          graded_at: string | null
          marks_obtained: number | null
          student_id: string
          submission_file: string | null
          submission_id: string
          submission_text: string | null
          submitted_at: string | null
        }
        Insert: {
          assignment_id: string
          feedback?: string | null
          graded_at?: string | null
          marks_obtained?: number | null
          student_id: string
          submission_file?: string | null
          submission_id?: string
          submission_text?: string | null
          submitted_at?: string | null
        }
        Update: {
          assignment_id?: string
          feedback?: string | null
          graded_at?: string | null
          marks_obtained?: number | null
          student_id?: string
          submission_file?: string | null
          submission_id?: string
          submission_text?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["assignment_id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["student_id"]
          },
        ]
      }
      super_admins: {
        Row: {
          auth_user_id: string
          created_at: string | null
          email: string
          full_name: string
          status: string | null
          super_admin_id: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string | null
          email: string
          full_name: string
          status?: string | null
          super_admin_id?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string | null
          email?: string
          full_name?: string
          status?: string | null
          super_admin_id?: string
        }
        Relationships: []
      }
      teacher_performance_analytics: {
        Row: {
          analysis_period: string | null
          analytics_id: string
          areas_for_improvement: string[] | null
          assignment_completion_rate: number | null
          attendance_rate: number | null
          class_results_avg: number | null
          created_at: string | null
          feedback_score: number | null
          recommendations: string | null
          school_id: string
          strengths: string[] | null
          student_improvement_rate: number | null
          teacher_id: string
        }
        Insert: {
          analysis_period?: string | null
          analytics_id?: string
          areas_for_improvement?: string[] | null
          assignment_completion_rate?: number | null
          attendance_rate?: number | null
          class_results_avg?: number | null
          created_at?: string | null
          feedback_score?: number | null
          recommendations?: string | null
          school_id: string
          strengths?: string[] | null
          student_improvement_rate?: number | null
          teacher_id: string
        }
        Update: {
          analysis_period?: string | null
          analytics_id?: string
          areas_for_improvement?: string[] | null
          assignment_completion_rate?: number | null
          attendance_rate?: number | null
          class_results_avg?: number | null
          created_at?: string | null
          feedback_score?: number | null
          recommendations?: string | null
          school_id?: string
          strengths?: string[] | null
          student_improvement_rate?: number | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_performance_analytics_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "teacher_performance_analytics_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["teacher_id"]
          },
        ]
      }
      teachers: {
        Row: {
          auth_user_id: string
          created_at: string | null
          email: string
          experience: number | null
          full_name: string
          phone: string | null
          profile_image: string | null
          qualification: string | null
          school_id: string
          status: string | null
          subject_specialization: string | null
          teacher_id: string
        }
        Insert: {
          auth_user_id: string
          created_at?: string | null
          email: string
          experience?: number | null
          full_name: string
          phone?: string | null
          profile_image?: string | null
          qualification?: string | null
          school_id: string
          status?: string | null
          subject_specialization?: string | null
          teacher_id?: string
        }
        Update: {
          auth_user_id?: string
          created_at?: string | null
          email?: string
          experience?: number | null
          full_name?: string
          phone?: string | null
          profile_image?: string | null
          qualification?: string | null
          school_id?: string
          status?: string | null
          subject_specialization?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      timetable: {
        Row: {
          class_id: string
          created_at: string | null
          day_of_week: string | null
          end_time: string
          is_break: boolean | null
          period_name: string | null
          period_type_id: string | null
          room_number: string | null
          start_time: string
          subject_id: string
          teacher_id: string | null
          timetable_id: string
        }
        Insert: {
          class_id: string
          created_at?: string | null
          day_of_week?: string | null
          end_time: string
          is_break?: boolean | null
          period_name?: string | null
          period_type_id?: string | null
          room_number?: string | null
          start_time: string
          subject_id: string
          teacher_id?: string | null
          timetable_id?: string
        }
        Update: {
          class_id?: string
          created_at?: string | null
          day_of_week?: string | null
          end_time?: string
          is_break?: boolean | null
          period_name?: string | null
          period_type_id?: string | null
          room_number?: string | null
          start_time?: string
          subject_id?: string
          teacher_id?: string | null
          timetable_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "timetable_period_type_id_fkey"
            columns: ["period_type_id"]
            isOneToOne: false
            referencedRelation: "period_types"
            referencedColumns: ["period_type_id"]
          },
          {
            foreignKeyName: "timetable_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_id"]
          },
        ]
      }
      timetable_templates: {
        Row: {
          configuration: Json
          created_at: string | null
          created_by: string
          description: string | null
          metadata: Json | null
          school_id: string
          template_id: string
          template_name: string
          updated_at: string | null
        }
        Insert: {
          configuration: Json
          created_at?: string | null
          created_by: string
          description?: string | null
          metadata?: Json | null
          school_id: string
          template_id?: string
          template_name: string
          updated_at?: string | null
        }
        Update: {
          configuration?: Json
          created_at?: string | null
          created_by?: string
          description?: string | null
          metadata?: Json | null
          school_id?: string
          template_id?: string
          template_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "timetable_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      transport: {
        Row: {
          created_at: string | null
          driver_name: string | null
          route_name: string
          school_id: string
          transport_id: string
          vehicle_no: string | null
        }
        Insert: {
          created_at?: string | null
          driver_name?: string | null
          route_name: string
          school_id: string
          transport_id?: string
          vehicle_no?: string | null
        }
        Update: {
          created_at?: string | null
          driver_name?: string | null
          route_name?: string
          school_id?: string
          transport_id?: string
          vehicle_no?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      typing_indicators: {
        Row: {
          conversation_id: string
          id: string
          is_typing: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_typing?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_status: {
        Row: {
          is_online: boolean | null
          last_seen: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          is_online?: boolean | null
          last_seen?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          is_online?: boolean | null
          last_seen?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          phone: string | null
          role: string | null
          school_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          phone?: string | null
          role?: string | null
          school_id?: string | null
          status?: string | null
          user_id?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          phone?: string | null
          role?: string | null
          school_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      voice_commands: {
        Row: {
          command_id: string
          command_text: string
          command_type: string | null
          created_at: string | null
          response: string | null
          school_id: string
          success: boolean | null
          user_id: string
          user_type: string
        }
        Insert: {
          command_id?: string
          command_text: string
          command_type?: string | null
          created_at?: string | null
          response?: string | null
          school_id: string
          success?: boolean | null
          user_id: string
          user_type: string
        }
        Update: {
          command_id?: string
          command_text?: string
          command_type?: string | null
          created_at?: string | null
          response?: string | null
          school_id?: string
          success?: boolean | null
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_commands_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      whitelisted_parents: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          relation: string | null
          school_id: string
          student_ids: string[]
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          relation?: string | null
          school_id: string
          student_ids: string[]
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          relation?: string | null
          school_id?: string
          student_ids?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "whitelisted_parents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
      whitelisted_teachers: {
        Row: {
          created_at: string | null
          created_by: string | null
          department: string | null
          email: string
          employee_id: string | null
          full_name: string
          id: string
          phone: string | null
          school_id: string
          subject_specialization: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          email: string
          employee_id?: string | null
          full_name: string
          id?: string
          phone?: string | null
          school_id: string
          subject_specialization?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          email?: string
          employee_id?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          school_id?: string
          subject_specialization?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whitelisted_teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_school_id: { Args: never; Returns: string }
      execute_sql_query: { Args: { query_text: string }; Returns: Json }
      get_admin_id: { Args: never; Returns: string }
      get_parent_id: { Args: never; Returns: string }
      get_student_id: { Args: never; Returns: string }
      get_teacher_class_ids: { Args: never; Returns: string[] }
      get_teacher_id: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      get_user_role_for_auth: { Args: { user_id: string }; Returns: string }
      has_role: { Args: { _role: string }; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student" | "parent"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "teacher", "student", "parent"],
    },
  },
} as const
