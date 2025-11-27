import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { action = 'generate' } = await req.json();

    // Get admin school_id
    const { data: adminData } = await supabaseClient
      .from('admins')
      .select('school_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!adminData) throw new Error('Admin not found');

    if (action === 'generate') {
      // Generate smart notifications for all users
      
      // 1. Low attendance alerts
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const { data: attendanceData } = await supabaseClient
        .from('attendance')
        .select(`
          student_id,
          status,
          students!inner(full_name),
          classes!inner(school_id)
        `)
        .eq('classes.school_id', adminData.school_id)
        .gte('date', thirtyDaysAgo);

      // Group by student
      const studentAttendance = new Map<string, { present: number; total: number; name: string }>();
      attendanceData?.forEach((record: any) => {
        if (!studentAttendance.has(record.student_id)) {
          studentAttendance.set(record.student_id, { present: 0, total: 0, name: record.students?.full_name || 'Unknown' });
        }
        const stats = studentAttendance.get(record.student_id)!;
        stats.total++;
        if (record.status === 'present') stats.present++;
      });

      // Send alerts for low attendance
      for (const [studentId, stats] of studentAttendance) {
        const rate = (stats.present / stats.total) * 100;
        if (rate < 75) {
          await supabaseClient.from('smart_notifications').insert({
            school_id: adminData.school_id,
            recipient_id: studentId,
            recipient_type: 'student',
            notification_type: 'alert',
            title: 'Low Attendance Alert',
            message: `Your attendance is ${rate.toFixed(1)}%. Please improve to maintain minimum 75% attendance.`,
            priority: 'high'
          });
        }
      }

      // 2. Upcoming exam reminders
      const { data: exams } = await supabaseClient
        .from('exams')
        .select('*, classes!inner(school_id, class_id)')
        .eq('classes.school_id', adminData.school_id)
        .gte('start_date', new Date().toISOString().split('T')[0])
        .lte('start_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      for (const exam of exams || []) {
        const { data: students } = await supabaseClient
          .from('students')
          .select('student_id')
          .eq('class_id', exam.class_id);

        for (const student of students || []) {
          await supabaseClient.from('smart_notifications').insert({
            school_id: adminData.school_id,
            recipient_id: student.student_id,
            recipient_type: 'student',
            notification_type: 'reminder',
            title: 'Upcoming Exam',
            message: `${exam.exam_name} starts on ${new Date(exam.start_date).toLocaleDateString()}. Prepare well!`,
            priority: 'medium'
          });
        }
      }

      // 3. Pending assignments reminder
      const { data: assignments } = await supabaseClient
        .from('assignments')
        .select(`
          assignment_id,
          title,
          due_date,
          class_id,
          classes!inner(school_id)
        `)
        .eq('classes.school_id', adminData.school_id)
        .gte('due_date', new Date().toISOString().split('T')[0]);

      for (const assignment of assignments || []) {
        const { data: students } = await supabaseClient
          .from('students')
          .select('student_id')
          .eq('class_id', assignment.class_id);

        const { data: submissions } = await supabaseClient
          .from('submissions')
          .select('student_id')
          .eq('assignment_id', assignment.assignment_id);

        const submittedIds = new Set(submissions?.map(s => s.student_id));

        for (const student of students || []) {
          if (!submittedIds.has(student.student_id)) {
            await supabaseClient.from('smart_notifications').insert({
              school_id: adminData.school_id,
              recipient_id: student.student_id,
              recipient_type: 'student',
              notification_type: 'reminder',
              title: 'Pending Assignment',
              message: `Assignment "${assignment.title}" is due on ${new Date(assignment.due_date).toLocaleDateString()}.`,
              priority: 'medium'
            });
          }
        }
      }

      // 4. Performance insights for students with declining marks
      const { data: recentResults } = await supabaseClient
        .from('exam_results')
        .select(`
          student_id,
          marks_obtained,
          max_marks,
          students!inner(full_name),
          exams!inner(school_id, exam_name)
        `)
        .eq('exams.school_id', adminData.school_id)
        .order('created_at', { ascending: false })
        .limit(200);

      const studentPerformance = new Map();
      recentResults?.forEach(result => {
        if (!studentPerformance.has(result.student_id)) {
          studentPerformance.set(result.student_id, []);
        }
        studentPerformance.get(result.student_id).push(
          (Number(result.marks_obtained) / Number(result.max_marks)) * 100
        );
      });

      for (const [studentId, marks] of studentPerformance) {
        if (marks.length >= 2) {
          const recent = marks.slice(0, Math.min(3, marks.length));
          const avg = recent.reduce((sum: number, m: number) => sum + m, 0) / recent.length;
          
          if (avg < 50) {
            await supabaseClient.from('smart_notifications').insert({
              school_id: adminData.school_id,
              recipient_id: studentId,
              recipient_type: 'student',
              notification_type: 'insight',
              title: 'Academic Support Available',
              message: `Your recent performance shows room for improvement. Consider using AI Study Assistant for personalized help.`,
              priority: 'medium'
            });
          }
        }
      }

      return new Response(JSON.stringify({ 
        success: true,
        message: 'Smart notifications generated successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-smart-notifications:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});