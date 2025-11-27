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

    const { teacherId, period = 'monthly' } = await req.json();

    // Get school_id
    const { data: adminData } = await supabaseClient
      .from('admins')
      .select('school_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!adminData) throw new Error('Admin not found');

    // Fetch teacher data
    const { data: teacher } = await supabaseClient
      .from('teachers')
      .select('*')
      .eq('teacher_id', teacherId)
      .single();

    if (!teacher) throw new Error('Teacher not found');

    // Get subjects taught by teacher
    const { data: subjects } = await supabaseClient
      .from('subjects')
      .select('*, classes!inner(school_id, class_id)')
      .eq('teacher_id', teacherId)
      .eq('classes.school_id', adminData.school_id);

    // Get exam results for students in teacher's subjects
    const subjectIds = subjects?.map(s => s.subject_id) || [];
    const { data: examResults } = await supabaseClient
      .from('exam_results')
      .select('*')
      .in('subject_id', subjectIds);

    // Get assignments created by teacher
    const { data: assignments } = await supabaseClient
      .from('assignments')
      .select('*, submissions(*)')
      .eq('teacher_id', teacherId);

    // Get attendance for teacher's classes
    const classIds = subjects?.map(s => s.class_id) || [];
    const { data: attendance } = await supabaseClient
      .from('attendance')
      .select('*')
      .in('class_id', classIds)
      .eq('marked_by', teacherId);

    // Calculate metrics
    const avgMarks = examResults && examResults.length > 0
      ? examResults.reduce((sum, r) => sum + (Number(r.marks_obtained) / Number(r.max_marks) * 100), 0) / examResults.length
      : 0;

    const totalSubmissions = assignments?.reduce((sum, a) => sum + (a.submissions?.length || 0), 0) || 0;
    const totalAssignments = (assignments?.length || 0) * 30; // Assuming ~30 students per class
    const completionRate = totalAssignments > 0 ? (totalSubmissions / totalAssignments) * 100 : 0;

    const attendanceRate = attendance && attendance.length > 0
      ? (attendance.filter(a => a.status === 'present').length / attendance.length) * 100
      : 0;

    // Call AI for analysis
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an AI analyzing teacher performance. Provide balanced feedback highlighting strengths and areas for improvement with specific actionable recommendations.'
          },
          {
            role: 'user',
            content: `Analyze teacher performance:\nTeacher: ${teacher.full_name}\nSubjects: ${subjects?.length || 0}\nAvg Class Results: ${avgMarks.toFixed(1)}%\nAssignment Completion: ${completionRate.toFixed(1)}%\nAttendance Marked: ${attendanceRate.toFixed(1)}%\n\nProvide: 1) Strengths, 2) Areas for improvement, 3) Specific recommendations`
          }
        ],
      }),
    });

    const aiData = await aiResponse.json();
    const aiAnalysis = aiData.choices[0].message.content;

    // Parse AI response for structured data
    let strengths: string[] = [];
    let improvements: string[] = [];
    let recommendations = aiAnalysis;

    try {
      const strengthsMatch = aiAnalysis.match(/strengths?[:\s]+([^\n]+(?:\n- [^\n]+)*)/i);
      const improvementsMatch = aiAnalysis.match(/(?:areas for improvement|improvements?)[:\s]+([^\n]+(?:\n- [^\n]+)*)/i);
      
      if (strengthsMatch) {
        strengths = strengthsMatch[1].split('\n').map((s: string) => s.replace(/^- /, '').trim()).filter(Boolean);
      }
      if (improvementsMatch) {
        improvements = improvementsMatch[1].split('\n').map((s: string) => s.replace(/^- /, '').trim()).filter(Boolean);
      }
    } catch (error) {
      console.error('Failed to parse AI analysis:', error);
    }

    // Store analytics
    const { data: analytics } = await supabaseClient
      .from('teacher_performance_analytics')
      .insert({
        school_id: adminData.school_id,
        teacher_id: teacherId,
        analysis_period: period,
        class_results_avg: avgMarks,
        student_improvement_rate: 0, // Would need historical data
        attendance_rate: attendanceRate,
        assignment_completion_rate: completionRate,
        feedback_score: 0, // Would need feedback system
        strengths,
        areas_for_improvement: improvements,
        recommendations
      })
      .select()
      .single();

    return new Response(JSON.stringify({ analytics }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-teacher-performance:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});