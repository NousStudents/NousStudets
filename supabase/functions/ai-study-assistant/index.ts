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
    const { sessionType, inputContent, subjectId, studentId } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build system prompt based on session type
    let systemPrompt = '';
    let userPrompt = inputContent;

    switch (sessionType) {
      case 'summary':
        systemPrompt = `You are an AI Study Assistant that helps students understand their study materials better. 
        Provide clear, concise summaries of the provided content. Break down complex topics into simple explanations.
        Focus on key concepts and important points.`;
        break;
      case 'quiz':
        systemPrompt = `You are an AI Study Assistant that creates educational quizzes.
        Based on the provided content, generate 5-10 multiple-choice questions with 4 options each.
        Include the correct answer and a brief explanation for each question.
        Format the response as JSON: { "questions": [{ "question": "", "options": [], "correct": 0, "explanation": "" }] }`;
        break;
      case 'flashcard':
        systemPrompt = `You are an AI Study Assistant that creates study flashcards.
        Based on the provided content, generate 5-10 flashcards with a term/concept on one side and explanation on the other.
        Format as JSON: { "flashcards": [{ "front": "", "back": "" }] }`;
        break;
      case 'doubt':
        systemPrompt = `You are an AI Study Assistant that helps students understand difficult concepts.
        Provide step-by-step explanations without giving complete solutions to exam questions.
        Guide the student through the thinking process. Break down the problem into smaller steps.
        Ask clarifying questions if needed. Focus on helping them learn, not just giving answers.`;
        break;
      case 'explanation':
        systemPrompt = `You are an AI Study Assistant that explains complex topics in simple terms.
        Use analogies, examples, and clear language suitable for students.
        Break down difficult concepts into easy-to-understand explanations.`;
        break;
      default:
        systemPrompt = 'You are a helpful AI Study Assistant for students.';
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
    const aiResponse = aiData.choices[0].message.content;

    // Store the session in database
    const { error: insertError } = await supabase
      .from('ai_study_sessions')
      .insert({
        student_id: studentId,
        session_type: sessionType,
        input_content: inputContent,
        ai_response: aiResponse,
        subject_id: subjectId || null,
      });

    if (insertError) {
      console.error('Database insert error:', insertError);
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-study-assistant:', error);
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