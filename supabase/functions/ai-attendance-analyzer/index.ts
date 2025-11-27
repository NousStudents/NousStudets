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
    const { classId, dateRange } = await req.json();

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

    // Get attendance records
    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = dateRange?.end || new Date().toISOString().split('T')[0];

    const { data: attendanceData, error: attendanceError } = await supabase
      .from('attendance')
      .select(`
        student_id,
        status,
        date,
        students (
          full_name,
          email
        )
      `)
      .eq('class_id', classId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (attendanceError) throw attendanceError;

    // Calculate attendance statistics
    const studentStats = new Map();
    const totalDays = new Set(attendanceData?.map((a: any) => a.date) || []).size;

    attendanceData?.forEach((record: any) => {
      if (!studentStats.has(record.student_id)) {
        studentStats.set(record.student_id, {
          student_id: record.student_id,
          full_name: record.students?.full_name || 'Unknown',
          total_days: 0,
          present_days: 0,
          absent_days: 0,
          late_days: 0,
        });
      }
      const stats = studentStats.get(record.student_id);
      stats.total_days++;
      if (record.status === 'present') stats.present_days++;
      else if (record.status === 'absent') stats.absent_days++;
      else if (record.status === 'late') stats.late_days++;
    });

    const statsArray = Array.from(studentStats.values()).map((s: any) => ({
      ...s,
      attendance_percentage: ((s.present_days / s.total_days) * 100).toFixed(1),
    }));

    const systemPrompt = `You are an AI Attendance Analyzer for teachers.
    Analyze the attendance data and provide:
    1. Identify students with attendance below 75% as frequently absent
    2. Predict students at risk of dropping out (attendance < 60% or declining trend)
    3. Provide specific, actionable recommendations for intervention
    4. Generate insights about attendance patterns
    
    Format response as JSON:
    {
      "frequent_absentees": [{"student_id": "...", "name": "...", "percentage": 65, "concern_level": "high"}],
      "predicted_dropouts": [{"student_id": "...", "name": "...", "risk_level": "high", "reasons": ["..."]}],
      "recommendations": "Specific action items...",
      "insights": "Key patterns and observations..."
    }`;

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
          { role: 'user', content: `Analyze this attendance data:\n${JSON.stringify(statsArray)}` }
        ],
        temperature: 0.7,
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
    const analysis = aiData.choices[0].message.content;

    let parsedAnalysis;
    try {
      parsedAnalysis = JSON.parse(analysis);
    } catch {
      parsedAnalysis = {
        frequent_absentees: statsArray.filter((s: any) => parseFloat(s.attendance_percentage) < 75),
        predicted_dropouts: statsArray.filter((s: any) => parseFloat(s.attendance_percentage) < 60),
        recommendations: analysis,
        insights: 'See analysis above',
      };
    }

    const { data: savedAnalysis, error: insertError } = await supabase
      .from('ai_attendance_analysis')
      .insert({
        teacher_id: teacher.teacher_id,
        class_id: classId,
        frequent_absentees: parsedAnalysis.frequent_absentees || [],
        predicted_dropouts: parsedAnalysis.predicted_dropouts || [],
        recommendations: parsedAnalysis.recommendations || '',
        insights: parsedAnalysis.insights || '',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to save analysis');
    }

    return new Response(
      JSON.stringify({ 
        analysis: savedAnalysis,
        rawStats: statsArray 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-attendance-analyzer:', error);
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