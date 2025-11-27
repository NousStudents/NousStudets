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

    const { insightType } = await req.json();

    // Get school_id for current admin
    const { data: adminData } = await supabaseClient
      .from('admins')
      .select('school_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!adminData) throw new Error('Admin not found');

    let insightData: any = {};
    let predictions: any = {};
    let recommendations = '';

    // Fetch data based on insight type
    if (insightType === 'attendance' || insightType === 'all') {
      const { data: attendanceData } = await supabaseClient
        .from('attendance')
        .select(`
          *,
          students!inner(student_id, full_name, class_id),
          classes!inner(school_id, class_name)
        `)
        .eq('classes.school_id', adminData.school_id)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      insightData.attendance = attendanceData;
    }

    if (insightType === 'academics' || insightType === 'all') {
      const { data: marksData } = await supabaseClient
        .from('exam_results')
        .select(`
          *,
          students!inner(student_id, full_name),
          exams!inner(exam_id, exam_name, class_id, school_id)
        `)
        .eq('exams.school_id', adminData.school_id);

      insightData.academics = marksData;
    }

    if (insightType === 'fee_collection' || insightType === 'all') {
      const { data: feesData } = await supabaseClient
        .from('fees')
        .select('*')
        .eq('school_id', adminData.school_id);

      insightData.feeCollection = feesData;
    }

    // Call AI for predictions and recommendations
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
            content: 'You are an AI assistant for school administration. Analyze data and provide predictions, risk alerts, and recommendations in JSON format.'
          },
          {
            role: 'user',
            content: `Analyze this school data for ${insightType} insights:\n${JSON.stringify(insightData)}\n\nProvide predictions, risk alerts, and actionable recommendations.`
          }
        ],
      }),
    });

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

    // Try to parse AI response as JSON
    try {
      const parsed = JSON.parse(aiContent);
      predictions = parsed.predictions || {};
      recommendations = parsed.recommendations || aiContent;
    } catch {
      recommendations = aiContent;
    }

    // Store insights
    const { data: insight } = await supabaseClient
      .from('admin_ai_insights')
      .insert({
        school_id: adminData.school_id,
        insight_type: insightType,
        insight_data: insightData,
        predictions,
        recommendations,
        generated_by: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-ai-insights:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});