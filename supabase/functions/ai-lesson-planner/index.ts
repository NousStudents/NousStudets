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
    const { topic, gradeLevel, subjectId, classId, duration } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get teacher ID from auth
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

    const systemPrompt = `You are an expert AI Lesson Plan Generator for teachers.
    Create a comprehensive, well-structured lesson plan that includes:
    1. Clear learning objectives and outcomes
    2. Step-by-step teaching methodology
    3. Engaging classroom activities with timing
    4. Real-world examples and demonstrations
    5. Assessment strategies
    6. Required resources and materials
    7. Differentiation strategies for different learners
    8. Homework/follow-up activities
    
    Format the response as structured JSON with these fields:
    - learning_outcomes: array of specific outcomes
    - teaching_steps: array of ordered teaching steps with timing
    - activities: array of engaging activities
    - examples: array of relevant examples
    - assessment: assessment strategies
    - resources: list of required materials
    - differentiation: strategies for different learner levels
    - homework: follow-up work`;

    const userPrompt = `Create a detailed lesson plan for:
    Topic: ${topic}
    Grade Level: ${gradeLevel}
    Duration: ${duration || 60} minutes
    
    Make it practical, engaging, and aligned with educational best practices.`;

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
    const lessonPlan = aiData.choices[0].message.content;

    // Try to parse as JSON, fallback to text
    let parsedPlan;
    try {
      parsedPlan = JSON.parse(lessonPlan);
    } catch {
      parsedPlan = { content: lessonPlan };
    }

    // Store in database
    const { data: savedPlan, error: insertError } = await supabase
      .from('ai_lesson_plans')
      .insert({
        teacher_id: teacher.teacher_id,
        subject_id: subjectId || null,
        class_id: classId || null,
        topic,
        grade_level: gradeLevel,
        duration_minutes: duration || 60,
        lesson_content: parsedPlan,
        teaching_steps: parsedPlan.teaching_steps || [],
        activities: parsedPlan.activities || [],
        learning_outcomes: parsedPlan.learning_outcomes || [],
        examples: parsedPlan.examples || [],
        resources: parsedPlan.resources || [],
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to save lesson plan');
    }

    return new Response(
      JSON.stringify({ lessonPlan: savedPlan }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-lesson-planner:', error);
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