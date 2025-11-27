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

    const { command, userType } = await req.json();

    // Get user context
    let userId: string;
    let schoolId: string;

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

    // Determine command type and fetch relevant data
    let commandType = 'general';
    let responseData: any = {};

    const commandLower = command.toLowerCase();
    
    if (commandLower.includes('timetable') || commandLower.includes('schedule')) {
      commandType = 'timetable';
      
      if (userType === 'student') {
        const { data: studentData } = await supabaseClient
          .from('students')
          .select('class_id')
          .eq('student_id', userId)
          .single();

        const { data: timetable } = await supabaseClient
          .from('timetable')
          .select('*, subjects(*), teachers(*)')
          .eq('class_id', studentData!.class_id);
        
        responseData.timetable = timetable;
      } else if (userType === 'teacher') {
        const { data: timetable } = await supabaseClient
          .from('timetable')
          .select('*, subjects(*), classes(*)')
          .eq('teacher_id', userId);
        
        responseData.timetable = timetable;
      }
    } else if (commandLower.includes('attendance')) {
      commandType = 'attendance';
      
      if (userType === 'teacher' || userType === 'admin') {
        const { data: attendance } = await supabaseClient
          .from('attendance')
          .select('*, students(*), classes(*)')
          .gte('date', new Date().toISOString().split('T')[0])
          .limit(50);
        
        responseData.attendance = attendance;
      }
    } else if (commandLower.includes('fee') || commandLower.includes('payment')) {
      commandType = 'fee_report';
      
      if (userType === 'admin') {
        const { data: fees } = await supabaseClient
          .from('fees')
          .select('*')
          .eq('school_id', schoolId);
        
        responseData.fees = fees;
      } else if (userType === 'student') {
        const { data: fees } = await supabaseClient
          .from('fees')
          .select('*')
          .eq('student_id', userId);
        
        responseData.fees = fees;
      }
    }

    // Call AI to generate natural language response
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
            content: `You are a voice assistant for a school management system. Provide clear, concise spoken responses. User type: ${userType}.`
          },
          {
            role: 'user',
            content: `Voice command: "${command}"\nData: ${JSON.stringify(responseData)}\n\nProvide a natural spoken response summarizing the information.`
          }
        ],
      }),
    });

    const aiData = await aiResponse.json();
    const response = aiData.choices[0].message.content;

    // Log voice command
    await supabaseClient
      .from('voice_commands')
      .insert({
        school_id: schoolId,
        user_id: userId,
        user_type: userType,
        command_text: command,
        command_type: commandType,
        response,
        success: true
      });

    return new Response(JSON.stringify({ 
      response,
      commandType,
      data: responseData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-voice-assistant:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});