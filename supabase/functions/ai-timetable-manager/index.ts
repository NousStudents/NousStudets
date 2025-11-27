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
    const { action, studentId, scheduleData } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (action === 'generate_schedule') {
      // Fetch student's current timetable and subjects
      const { data: student } = await supabase
        .from('students')
        .select('class_id')
        .eq('student_id', studentId)
        .single();

      if (!student) {
        throw new Error('Student not found');
      }

      const { data: subjects } = await supabase
        .from('subjects')
        .select('subject_id, subject_name')
        .eq('class_id', student.class_id);

      // Fetch recent performance data
      const { data: predictions } = await supabase
        .from('ai_performance_predictions')
        .select('weak_subjects')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(1);

      const weakSubjects = predictions?.[0]?.weak_subjects || [];

      // Use AI to generate optimized schedule
      if (!LOVABLE_API_KEY) {
        throw new Error('LOVABLE_API_KEY is not configured');
      }

      const systemPrompt = `You are an AI Timetable Manager that creates personalized study schedules.
      Analyze the student's subjects and weak areas to create an optimized study plan.
      Consider:
      - Prioritize weak subjects
      - Balance study time across all subjects
      - Include breaks and rest periods
      - Suggest optimal study times
      - Account for assignment deadlines
      
      Return the schedule as JSON: {
        "schedule": [
          {
            "subject_id": "uuid",
            "subject_name": "string",
            "scheduled_time": "ISO timestamp",
            "duration_minutes": number,
            "priority_level": "high|medium|low",
            "reason": "why this time and priority"
          }
        ]
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
            { 
              role: 'user', 
              content: `Create a study schedule for these subjects: ${JSON.stringify(subjects)}. 
              Weak subjects that need extra attention: ${JSON.stringify(weakSubjects)}.
              Schedule for the next 7 days, starting from today.` 
            }
          ],
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`);
      }

      const aiData = await response.json();
      const scheduleText = aiData.choices[0].message.content;

      // Parse AI response and insert schedules
      let generatedSchedules;
      try {
        // Try to extract JSON from the response
        const jsonMatch = scheduleText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          generatedSchedules = parsed.schedule;
        }
      } catch (e) {
        console.error('Failed to parse AI schedule:', e);
      }

      if (generatedSchedules && Array.isArray(generatedSchedules)) {
        const scheduleInserts = generatedSchedules.map(s => ({
          student_id: studentId,
          subject_id: s.subject_id,
          scheduled_time: s.scheduled_time,
          duration_minutes: s.duration_minutes,
          priority_level: s.priority_level,
        }));

        const { error: insertError } = await supabase
          .from('ai_study_schedules')
          .insert(scheduleInserts);

        if (insertError) {
          console.error('Database insert error:', insertError);
        }
      }

      return new Response(
        JSON.stringify({ schedule: generatedSchedules, rawResponse: scheduleText }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'get_reminders') {
      // Get upcoming study sessions
      const { data: upcomingSchedules } = await supabase
        .from('ai_study_schedules')
        .select(`
          *,
          subjects:subject_id (subject_name)
        `)
        .eq('student_id', studentId)
        .eq('completed', false)
        .gte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true })
        .limit(10);

      return new Response(
        JSON.stringify({ reminders: upcomingSchedules }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'mark_completed') {
      const { scheduleId } = scheduleData;
      
      const { error: updateError } = await supabase
        .from('ai_study_schedules')
        .update({ completed: true })
        .eq('schedule_id', scheduleId);

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('Error in ai-timetable-manager:', error);
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