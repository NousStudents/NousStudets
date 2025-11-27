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
    const { helpType, homeworkContent, subjectId, studentId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build system prompt based on help type
    let systemPrompt = '';
    let userPrompt = homeworkContent;

    switch (helpType) {
      case 'mistake_detection':
        systemPrompt = `You are an AI Homework Helper that identifies mistakes in student work.
        Carefully review the provided homework content and identify errors in:
        - Calculations and mathematical mistakes
        - Logical errors in reasoning
        - Factual inaccuracies
        - Format and structure issues
        Provide specific feedback on each mistake with the correct approach.
        Do not provide complete solutions, only point out errors and guide toward correct methods.`;
        break;
      case 'hint':
        systemPrompt = `You are an AI Homework Helper that provides helpful hints.
        Give subtle hints that guide students toward the solution without revealing the complete answer.
        Ask leading questions, suggest approaches, or provide relevant examples.
        Help them think through the problem step by step.`;
        break;
      case 'grammar':
        systemPrompt = `You are an AI Homework Helper specialized in grammar and language corrections.
        Review the provided text for:
        - Grammar errors
        - Spelling mistakes
        - Punctuation errors
        - Sentence structure issues
        - Word choice improvements
        Provide specific corrections with explanations.`;
        break;
      case 'sample_answer':
        systemPrompt = `You are an AI Homework Helper that provides sample answers.
        Create a well-structured sample answer for the given homework question.
        Explain the reasoning and approach used. This should serve as a learning example.
        Include step-by-step breakdown of the solution process.`;
        break;
      case 'worksheet':
        systemPrompt = `You are an AI Homework Helper that generates practice worksheets.
        Based on the provided topic or question, create 5-10 similar practice problems.
        Include varying difficulty levels (easy, medium, hard).
        Format as JSON: { "problems": [{ "question": "", "difficulty": "", "hints": [] }] }`;
        break;
      default:
        systemPrompt = 'You are a helpful AI Homework Helper for students.';
    }

    // Call Lovable AI
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
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI request failed: ${response.status}`);
    }

    const aiData = await response.json();
    const aiFeedback = aiData.choices[0].message.content;

    // Store the help session in database
    const { error: insertError } = await supabase
      .from('ai_homework_help')
      .insert({
        student_id: studentId,
        help_type: helpType,
        homework_content: homeworkContent,
        ai_feedback: aiFeedback,
        subject_id: subjectId || null,
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
    }

    return new Response(
      JSON.stringify({ feedback: aiFeedback }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-homework-helper:', error);
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