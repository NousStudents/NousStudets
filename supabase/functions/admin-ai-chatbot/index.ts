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

    const { message, conversationId, userType } = await req.json();

    // Get user context
    let userId: string;
    let schoolId: string;
    let context: any = {};

    if (userType === 'admin') {
      const { data } = await supabaseClient
        .from('admins')
        .select('admin_id, school_id')
        .eq('auth_user_id', user.id)
        .single();
      userId = data!.admin_id;
      schoolId = data!.school_id;
    } else if (userType === 'teacher') {
      const { data } = await supabaseClient
        .from('teachers')
        .select('teacher_id, school_id')
        .eq('auth_user_id', user.id)
        .single();
      userId = data!.teacher_id;
      schoolId = data!.school_id;
    } else if (userType === 'student') {
      const { data } = await supabaseClient
        .from('students')
        .select('student_id, class_id')
        .eq('auth_user_id', user.id)
        .single();
      userId = data!.student_id;
      
      const { data: classData } = await supabaseClient
        .from('classes')
        .select('school_id')
        .eq('class_id', data!.class_id)
        .single();
      schoolId = classData!.school_id;
    } else {
      const { data } = await supabaseClient
        .from('parents')
        .select('parent_id, school_id')
        .eq('auth_user_id', user.id)
        .single();
      userId = data!.parent_id;
      schoolId = data!.school_id;
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      const { data } = await supabaseClient
        .from('ai_chatbot_conversations')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();
      conversation = data;
    } else {
      const { data } = await supabaseClient
        .from('ai_chatbot_conversations')
        .insert({
          school_id: schoolId,
          user_id: userId,
          user_type: userType,
          messages: []
        })
        .select()
        .single();
      conversation = data;
    }

    // Add user message to conversation
    const messages = conversation.messages as any[] || [];
    messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });

    // Build system prompt based on user type
    let systemPrompt = 'You are a helpful AI assistant for a school management system.';
    if (userType === 'admin') {
      systemPrompt += ' Assist with administrative tasks, analytics, reports, and school management queries.';
    } else if (userType === 'teacher') {
      systemPrompt += ' Help with teaching tasks, student management, assignments, and class activities.';
    } else if (userType === 'student') {
      systemPrompt += ' Help with studies, homework, schedules, and academic queries. Be encouraging and supportive.';
    } else {
      systemPrompt += ' Help parents track their children\'s progress, view reports, and communicate with school.';
    }

    // Call AI
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
          { role: 'system', content: systemPrompt },
          ...messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
        ],
      }),
    });

    const aiData = await aiResponse.json();
    const aiMessage = aiData.choices[0].message.content;

    // Add AI response to conversation
    messages.push({ role: 'assistant', content: aiMessage, timestamp: new Date().toISOString() });

    // Update conversation
    await supabaseClient
      .from('ai_chatbot_conversations')
      .update({ messages, updated_at: new Date().toISOString() })
      .eq('conversation_id', conversation.conversation_id);

    return new Response(JSON.stringify({ 
      conversationId: conversation.conversation_id,
      message: aiMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-ai-chatbot:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});