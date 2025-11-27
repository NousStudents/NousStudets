import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentId, subjectId, examId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) throw new Error('Unauthorized');

    const { data: teacher } = await supabase
      .from('teachers')
      .select('teacher_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!teacher) throw new Error('Teacher not found');

    // Fetch student data
    const { data: student } = await supabase
      .from('students')
      .select('full_name, class_id')
      .eq('student_id', studentId)
      .single();

    // Fetch exam results
    const { data: examResults } = await supabase
      .from('exam_results')
      .select(`
        marks_obtained,
        max_marks,
        grade,
        subject_id,
        subjects (subject_name)
      `)
      .eq('student_id', studentId)
      .eq('exam_id', examId);

    // Fetch attendance
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('status')
      .eq('student_id', studentId)
      .gte('date', thirtyDaysAgo);

    const presentDays = attendanceData?.filter((a: any) => a.status === 'present').length || 0;
    const totalDays = attendanceData?.length || 1;
    const attendancePercentage = ((presentDays / totalDays) * 100).toFixed(1);

    // Fetch assignment submissions
    const { data: submissions } = await supabase
      .from('submissions')
      .select('marks_obtained, assignments(max_marks)')
      .eq('student_id', studentId);

    const subjectResult = examResults?.[0];
    const subjectName = (subjectResult?.subjects as any)?.subject_name || 'Overall';

    const systemPrompt = `You are an AI Report Card Comment Writer for teachers.
    Generate a personalized, professional, and encouraging comment for a student's report card.
    
    The comment should:
    1. Be 3-4 sentences long, professional and warm
    2. Acknowledge specific strengths and achievements
    3. Provide constructive feedback on areas for improvement
    4. Include attendance and behavior remarks if relevant
    5. End with encouragement and next steps
    
    Format as JSON:
    {
      "comment_text": "Main report card comment (3-4 sentences)",
      "performance_summary": "Brief performance overview",
      "strengths": ["strength1", "strength2"],
      "areas_for_improvement": ["area1", "area2"],
      "attendance_remarks": "Comment on attendance",
      "behavior_remarks": "Comment on behavior and participation"
    }`;

    const userPrompt = `Generate a report card comment for:
    Student: ${student?.full_name}
    Subject: ${subjectName}
    Marks: ${subjectResult?.marks_obtained || 'N/A'}/${subjectResult?.max_marks || 'N/A'}
    Grade: ${subjectResult?.grade || 'N/A'}
    Attendance: ${attendancePercentage}%
    Assignment Performance: ${submissions?.length || 0} submissions
    
    Make it personal, constructive, and encouraging.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI request failed: ${response.status}`);
    }

    const aiData = await response.json();
    const commentData = aiData.choices[0].message.content;

    let parsedComment;
    try {
      parsedComment = JSON.parse(commentData);
    } catch {
      parsedComment = {
        comment_text: commentData,
        performance_summary: 'See comment',
        strengths: [],
        areas_for_improvement: [],
        attendance_remarks: `Attendance: ${attendancePercentage}%`,
        behavior_remarks: 'Satisfactory',
      };
    }

    const { data: savedComment, error: insertError } = await supabase
      .from('ai_report_comments')
      .insert({
        teacher_id: teacher.teacher_id,
        student_id: studentId,
        subject_id: subjectId || null,
        exam_id: examId || null,
        comment_text: parsedComment.comment_text,
        performance_summary: parsedComment.performance_summary,
        strengths: parsedComment.strengths || [],
        areas_for_improvement: parsedComment.areas_for_improvement || [],
        attendance_remarks: parsedComment.attendance_remarks,
        behavior_remarks: parsedComment.behavior_remarks,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to save comment');
    }

    return new Response(
      JSON.stringify({ comment: savedComment }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-report-writer:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});