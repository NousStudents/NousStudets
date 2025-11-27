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
    const { topic, assignmentType, difficultyLevel, questionCount, subjectId, classId } = await req.json();

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

    let systemPrompt = '';
    let autoGradable = false;

    switch (assignmentType) {
      case 'mcq':
        autoGradable = true;
        systemPrompt = `You are an AI Assignment Generator. Create ${questionCount || 10} multiple choice questions on the topic.
        Each question must have 4 options (A, B, C, D) and indicate the correct answer.
        Format as JSON array: [{ "question": "...", "options": ["A) ...", "B) ...", "C) ...", "D) ..."], "correct": "A", "explanation": "..." }]`;
        break;
      case 'short_answer':
        systemPrompt = `Create ${questionCount || 5} short answer questions requiring 2-3 sentence responses.
        Include model answers and marking rubrics.
        Format as JSON array: [{ "question": "...", "model_answer": "...", "marks": 2, "rubric": "..." }]`;
        break;
      case 'descriptive':
        systemPrompt = `Create ${questionCount || 3} descriptive/essay questions requiring detailed analysis.
        Include comprehensive model answers and evaluation criteria.
        Format as JSON array: [{ "question": "...", "model_answer": "...", "marks": 10, "evaluation_criteria": [...] }]`;
        break;
      case 'coding':
        systemPrompt = `Create ${questionCount || 5} programming/coding questions with test cases.
        Include problem description, sample input/output, and solution code.
        Format as JSON array: [{ "problem": "...", "input": "...", "output": "...", "test_cases": [...], "solution": "...", "marks": 5 }]`;
        break;
      case 'full_paper':
        systemPrompt = `Create a complete question paper with mixed question types:
        - 10 MCQs (1 mark each)
        - 5 Short answers (2 marks each)
        - 3 Long answers (5 marks each)
        Total: 35 marks. Include detailed answer key and marking scheme.`;
        break;
      default:
        systemPrompt = 'Create assessment questions on the topic.';
    }

    systemPrompt += `\nDifficulty level: ${difficultyLevel || 'medium'}
    Ensure questions test understanding, not just memorization.`;

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
          { role: 'user', content: `Topic: ${topic}` }
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
    const generatedContent = aiData.choices[0].message.content;

    let questions, answerKey;
    try {
      const parsed = JSON.parse(generatedContent);
      questions = Array.isArray(parsed) ? parsed : parsed.questions;
      answerKey = parsed.answer_key || parsed;
    } catch {
      questions = [{ content: generatedContent }];
      answerKey = { note: 'See generated content for answers' };
    }

    // Calculate max marks
    let maxMarks = 0;
    if (Array.isArray(questions)) {
      maxMarks = questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0);
    }

    const { data: savedAssignment, error: insertError } = await supabase
      .from('ai_generated_assignments')
      .insert({
        teacher_id: teacher.teacher_id,
        subject_id: subjectId || null,
        class_id: classId || null,
        assignment_type: assignmentType,
        topic,
        difficulty_level: difficultyLevel || 'medium',
        questions,
        answer_key: answerKey,
        max_marks: maxMarks,
        auto_gradable: autoGradable,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      throw new Error('Failed to save assignment');
    }

    return new Response(
      JSON.stringify({ assignment: savedAssignment }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-assignment-generator:', error);
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