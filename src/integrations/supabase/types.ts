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
          user_id: string
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
          user_id: string
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
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admins_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
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
        Relationships: [
          {
            foreignKeyName: "ai_tools_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
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
      messages: {
        Row: {
          message_id: string
          message_text: string
          read_at: string | null
          receiver_id: string
          school_id: string
          sender_id: string
          sent_at: string | null
        }
        Insert: {
          message_id?: string
          message_text: string
          read_at?: string | null
          receiver_id: string
          school_id: string
          sender_id: string
          sent_at?: string | null
        }
        Update: {
          message_id?: string
          message_text?: string
          read_at?: string | null
          receiver_id?: string
          school_id?: string
          sender_id?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "messages_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
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
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
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
          user_id: string
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
          user_id: string
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
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "parents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
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
      students: {
        Row: {
          admission_date: string | null
          auth_user_id: string
          class_id: string | null
          created_at: string | null
          dob: string | null
          email: string
          full_name: string
          gender: string | null
          parent_id: string | null
          phone: string | null
          profile_picture: string | null
          roll_no: string | null
          section: string | null
          status: string | null
          student_id: string
          user_id: string
        }
        Insert: {
          admission_date?: string | null
          auth_user_id: string
          class_id?: string | null
          created_at?: string | null
          dob?: string | null
          email: string
          full_name: string
          gender?: string | null
          parent_id?: string | null
          phone?: string | null
          profile_picture?: string | null
          roll_no?: string | null
          section?: string | null
          status?: string | null
          student_id?: string
          user_id: string
        }
        Update: {
          admission_date?: string | null
          auth_user_id?: string
          class_id?: string | null
          created_at?: string | null
          dob?: string | null
          email?: string
          full_name?: string
          gender?: string | null
          parent_id?: string | null
          phone?: string | null
          profile_picture?: string | null
          roll_no?: string | null
          section?: string | null
          status?: string | null
          student_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
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
          user_id: string
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
          user_id: string
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
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["school_id"]
          },
          {
            foreignKeyName: "teachers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      timetable: {
        Row: {
          class_id: string
          created_at: string | null
          day_of_week: string | null
          end_time: string
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
            foreignKeyName: "timetable_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_id"]
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
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          auth_user_id: string | null
          created_at: string | null
          email: string
          full_name: string
          phone: string | null
          profile_image: string | null
          role: string
          school_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string | null
          email: string
          full_name: string
          phone?: string | null
          profile_image?: string | null
          role: string
          school_id: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          phone?: string | null
          profile_image?: string | null
          role?: string
          school_id?: string
          status?: string | null
          updated_at?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_school_id: { Args: never; Returns: string }
      current_user_id: { Args: never; Returns: string }
      get_teacher_school_id: { Args: { _teacher_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_user_creation: {
        Args: { _details: Json; _performed_by: string; _target_user_id: string }
        Returns: string
      }
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
