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

    // Get school_id
    const { data: adminData } = await supabaseClient
      .from('admins')
      .select('school_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!adminData) throw new Error('Admin not found');

    // Fetch fee data
    const { data: fees } = await supabaseClient
      .from('fees')
      .select('*, students!inner(student_id, full_name)')
      .eq('school_id', adminData.school_id);

    // Calculate totals
    const totalExpected = fees?.reduce((sum, fee) => sum + Number(fee.amount), 0) || 0;
    const totalCollected = fees?.filter(f => f.status === 'paid').reduce((sum, fee) => sum + Number(fee.amount), 0) || 0;
    const totalPending = totalExpected - totalCollected;

    // Identify unusual activities
    const unusualActivities: any[] = [];
    const overdueCount = fees?.filter(f => f.status === 'pending' && new Date(f.due_date) < new Date()).length || 0;
    
    if (overdueCount > (fees?.length || 0) * 0.3) {
      unusualActivities.push({
        type: 'high_overdue_rate',
        count: overdueCount,
        percentage: ((overdueCount / (fees?.length || 1)) * 100).toFixed(1)
      });
    }

    // Call AI for predictions
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
            content: 'You are an AI financial analyst for schools. Analyze fee data and provide predictions, identify patterns, and recommend collection strategies.'
          },
          {
            role: 'user',
            content: `Analyze this fee data:\nTotal Expected: ${totalExpected}\nTotal Collected: ${totalCollected}\nTotal Pending: ${totalPending}\nOverdue Count: ${overdueCount}\nFee Records: ${JSON.stringify(fees)}\n\nProvide: 1) Collection forecast for next 3 months, 2) Risk assessment, 3) Recommended actions`
          }
        ],
      }),
    });

    const aiData = await aiResponse.json();
    const recommendations = aiData.choices[0].message.content;

    // Store prediction
    const { data: prediction } = await supabaseClient
      .from('fee_predictions')
      .insert({
        school_id: adminData.school_id,
        total_expected: totalExpected,
        total_collected: totalCollected,
        total_pending: totalPending,
        predictions: {
          collectionRate: ((totalCollected / totalExpected) * 100).toFixed(1),
          overdueCount,
          riskLevel: overdueCount > 10 ? 'high' : overdueCount > 5 ? 'medium' : 'low'
        },
        unusual_activities: unusualActivities,
        recommendations
      })
      .select()
      .single();

    // Generate notifications for high-risk pending fees
    const highRiskFees = fees?.filter(f => 
      f.status === 'pending' && 
      new Date(f.due_date) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ) || [];

    for (const fee of highRiskFees.slice(0, 10)) {
      await supabaseClient.from('smart_notifications').insert({
        school_id: adminData.school_id,
        recipient_id: fee.student_id,
        recipient_type: 'student',
        notification_type: 'reminder',
        title: 'Fee Payment Reminder',
        message: `Your fee of ₹${fee.amount} is overdue. Please make payment at the earliest.`,
        priority: 'high',
        metadata: { fee_id: fee.fee_id }
      });
    }

    return new Response(JSON.stringify({ prediction }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in admin-fee-predictions:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});