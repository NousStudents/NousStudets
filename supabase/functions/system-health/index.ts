import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.80.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const healthStatus = {
      database: 'operational',
      authentication: 'operational',
      storage: 'operational',
      notifications: 'operational',
      timestamp: new Date().toISOString(),
    };

    // Check Database
    try {
      const { error: dbError } = await supabase
        .from('schools')
        .select('school_id')
        .limit(1);
      
      if (dbError) {
        healthStatus.database = 'degraded';
      }
    } catch (error) {
      console.error('Database check failed:', error);
      healthStatus.database = 'outage';
    }

    // Check Authentication
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1,
      });
      
      if (authError) {
        healthStatus.authentication = 'degraded';
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      healthStatus.authentication = 'outage';
    }

    // Check Storage
    try {
      const { data: buckets, error: storageError } = await supabase.storage.listBuckets();
      
      if (storageError) {
        healthStatus.storage = 'degraded';
      }
    } catch (error) {
      console.error('Storage check failed:', error);
      healthStatus.storage = 'outage';
    }

    // Check Notifications (check if notifications table is accessible)
    try {
      const { error: notifError } = await supabase
        .from('notifications')
        .select('notification_id')
        .limit(1);
      
      if (notifError) {
        healthStatus.notifications = 'degraded';
      }
    } catch (error) {
      console.error('Notifications check failed:', error);
      healthStatus.notifications = 'outage';
    }

    return new Response(JSON.stringify(healthStatus), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Health check error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({
        database: 'outage',
        authentication: 'outage',
        storage: 'outage',
        notifications: 'outage',
        timestamp: new Date().toISOString(),
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
