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
    const { studentId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Fetch student data
    const { data: student } = await supabase
      .from('students')
      .select('class_id, full_name')
      .eq('student_id', studentId)
      .single();

    if (!student) {
      throw new Error('Student not found');
    }

    // Fetch attendance data
    const { data: attendanceData, count: totalDays } = await supabase
      .from('attendance')
      .select('status', { count: 'exact' })
      .eq('student_id', studentId);

    const presentDays = attendanceData?.filter(a => a.status === 'present').length || 0;
    const attendanceScore = (totalDays && totalDays > 0) ? (presentDays / totalDays) * 100 : 100;

    // Fetch marks/exam results
    const { data: examResults } = await supabase
      .from('exam_results')
      .select(`
        marks_obtained,
        max_marks,
        subjects:subject_id (subject_name)
      `)
      .eq('student_id', studentId);

    let totalMarksPercentage = 0;
    const subjectPerformance: any = {};

    if (examResults && examResults.length > 0) {
      examResults.forEach(result => {
        const percentage = (result.marks_obtained / result.max_marks) * 100;
        const subjectName = (result.subjects as any)?.subject_name || 'Unknown';
        
        if (!subjectPerformance[subjectName]) {
          subjectPerformance[subjectName] = { total: 0, count: 0 };
        }
        
        subjectPerformance[subjectName].total += percentage;
        subjectPerformance[subjectName].count += 1;
      });

      const totalPercentages = Object.values(subjectPerformance).reduce(
        (sum: number, perf: any) => sum + (perf.total / perf.count), 
        0
      );
      totalMarksPercentage = totalPercentages / Object.keys(subjectPerformance).length;
    } else {
      totalMarksPercentage = 75; // Default if no results
    }

    // Fetch assignment submission data
    const { data: assignments } = await supabase
      .from('assignment_students')
      .select(`
        assignment:assignment_id (assignment_id),
        submission:submissions (submitted_at, marks_obtained)
      `)
      .eq('student_id', studentId);

    const submittedAssignments = assignments?.filter(a => 
      (a.submission as any)?.submitted_at
    ).length || 0;
    const totalAssignments = assignments?.length || 1;
    const assignmentScore = (submittedAssignments / totalAssignments) * 100;

    // Calculate overall risk level
    const overallScore = (attendanceScore + totalMarksPercentage + assignmentScore) / 3;
    let riskLevel = 'low';
    if (overallScore < 50) {
      riskLevel = 'high';
    } else if (overallScore < 70) {
      riskLevel = 'medium';
    }

    // Identify weak subjects
    const weakSubjects = Object.entries(subjectPerformance)
      .filter(([_, perf]: any) => (perf.total / perf.count) < 60)
      .map(([name, perf]: any) => ({
        subject: name,
        average: (perf.total / perf.count).toFixed(2)
      }));

    // Use AI to generate recommendations
    const systemPrompt = `You are an AI Performance Predictor that analyzes student performance data.
    Based on the provided metrics, generate personalized recommendations and learning paths.
    Focus on:
    - Specific actionable advice
    - Study strategies for weak subjects
    - Time management tips
    - Motivation and encouragement
    - Realistic improvement goals
    
    Be supportive and constructive.`;

    const userPrompt = `Analyze this student's performance:
    - Attendance: ${attendanceScore.toFixed(1)}%
    - Average Marks: ${totalMarksPercentage.toFixed(1)}%
    - Assignment Completion: ${assignmentScore.toFixed(1)}%
    - Risk Level: ${riskLevel}
    - Weak Subjects: ${JSON.stringify(weakSubjects)}
    
    Provide personalized recommendations and a learning path to improve performance.`;

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
      throw new Error(`AI request failed: ${response.status}`);
    }

    const aiData = await response.json();
    const recommendations = aiData.choices[0].message.content;

    // Store prediction in database
    const { data: prediction, error: insertError } = await supabase
      .from('ai_performance_predictions')
      .insert({
        student_id: studentId,
        attendance_score: attendanceScore,
        marks_score: totalMarksPercentage,
        assignment_score: assignmentScore,
        behavior_score: 75, // Default for now
        overall_risk_level: riskLevel,
        weak_subjects: weakSubjects,
        recommendations: recommendations,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
    }

    return new Response(
      JSON.stringify({
        prediction: {
          attendance_score: attendanceScore,
          marks_score: totalMarksPercentage,
          assignment_score: assignmentScore,
          overall_risk_level: riskLevel,
          weak_subjects: weakSubjects,
          recommendations: recommendations,
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-performance-predictor:', error);
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