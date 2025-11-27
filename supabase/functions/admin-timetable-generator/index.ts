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

    const { classIds, preferences } = await req.json();

    // Get school_id
    const { data: adminData } = await supabaseClient
      .from('admins')
      .select('school_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!adminData) throw new Error('Admin not found');

    // Fetch teachers, subjects, classes
    const { data: teachers } = await supabaseClient
      .from('teachers')
      .select('*')
      .eq('school_id', adminData.school_id);

    const { data: subjects } = await supabaseClient
      .from('subjects')
      .select('*, classes!inner(school_id)')
      .eq('classes.school_id', adminData.school_id);

    const { data: classes } = await supabaseClient
      .from('classes')
      .select('*')
      .eq('school_id', adminData.school_id)
      .in('class_id', classIds || []);

    // Call AI to generate timetable
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
            content: 'You are an AI timetable generator. Create optimal school timetables avoiding teacher conflicts, ensuring breaks, and balancing subject distribution. Return a structured JSON array of timetable entries.'
          },
          {
            role: 'user',
            content: `Generate a weekly timetable for these classes:\n${JSON.stringify(classes)}\n\nSubjects: ${JSON.stringify(subjects)}\nTeachers: ${JSON.stringify(teachers)}\nPreferences: ${JSON.stringify(preferences || {})}\n\nReturn JSON array with fields: class_id, subject_id, teacher_id, day_of_week, start_time, end_time, period_name`
          }
        ],
      }),
    });

    const aiData = await aiResponse.json();
    const timetableText = aiData.choices[0].message.content;

    // Parse AI response
    let timetableEntries: any[] = [];
    try {
      // Try to extract JSON from response
      const jsonMatch = timetableText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        timetableEntries = JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Failed to parse AI timetable:', error);
      throw new Error('Failed to generate timetable structure');
    }

    // Validate and detect conflicts
    const conflicts: any[] = [];
    const teacherSchedule: Map<string, Set<string>> = new Map();

    for (const entry of timetableEntries) {
      const key = `${entry.teacher_id}-${entry.day_of_week}-${entry.start_time}`;
      if (teacherSchedule.has(key)) {
        conflicts.push({
          type: 'teacher_conflict',
          teacher_id: entry.teacher_id,
          day: entry.day_of_week,
          time: entry.start_time
        });
      }
      if (!teacherSchedule.has(key)) {
        teacherSchedule.set(key, new Set());
      }
      teacherSchedule.get(key)!.add(entry.class_id);
    }

    return new Response(JSON.stringify({ 
      timetable: timetableEntries,
      conflicts,
      summary: {
        totalEntries: timetableEntries.length,
        conflictCount: conflicts.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-timetable-generator:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});