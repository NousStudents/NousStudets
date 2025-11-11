import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: userData } = await supabaseClient
      .from('users')
      .select('user_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!userData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user_id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Access Denied: Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';

    if (action === 'list') {
      // Find orphaned users (users without valid auth_user_id)
      const { data: allUsers } = await supabaseClient
        .from('users')
        .select('user_id, email, full_name, auth_user_id, created_at, role');

      const orphanedUsers = [];
      if (allUsers) {
        for (const user of allUsers) {
          if (user.auth_user_id) {
            const { data: authUser } = await supabaseClient.auth.admin.getUserById(user.auth_user_id);
            if (!authUser.user) {
              orphanedUsers.push({
                ...user,
                type: 'user_without_auth',
                reason: 'User record exists but auth user was deleted'
              });
            }
          } else {
            orphanedUsers.push({
              ...user,
              type: 'user_without_auth_id',
              reason: 'User record has no auth_user_id'
            });
          }
        }
      }

      // Find orphaned auth users (auth users without users record)
      const { data: { users: authUsers } } = await supabaseClient.auth.admin.listUsers();
      const orphanedAuthUsers = [];
      
      for (const authUser of authUsers) {
        const { data: userRecord } = await supabaseClient
          .from('users')
          .select('user_id')
          .eq('auth_user_id', authUser.id)
          .maybeSingle();
        
        if (!userRecord) {
          orphanedAuthUsers.push({
            auth_user_id: authUser.id,
            email: authUser.email,
            created_at: authUser.created_at,
            type: 'auth_without_user',
            reason: 'Auth user exists but no user record in database'
          });
        }
      }

      return new Response(
        JSON.stringify({
          orphanedUsers,
          orphanedAuthUsers,
          summary: {
            totalOrphanedUsers: orphanedUsers.length,
            totalOrphanedAuthUsers: orphanedAuthUsers.length,
            total: orphanedUsers.length + orphanedAuthUsers.length
          }
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'cleanup') {
      const body = await req.json();
      const { userId, type } = body;

      if (!userId || !type) {
        return new Response(
          JSON.stringify({ error: 'Missing userId or type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let deletedCount = 0;

      if (type === 'user_without_auth' || type === 'user_without_auth_id') {
        // Delete role-specific records
        await supabaseClient.from('teachers').delete().eq('user_id', userId);
        await supabaseClient.from('students').delete().eq('user_id', userId);
        await supabaseClient.from('parents').delete().eq('user_id', userId);
        
        // Delete user roles
        await supabaseClient.from('user_roles').delete().eq('user_id', userId);
        
        // Delete user record
        const { error: deleteError } = await supabaseClient
          .from('users')
          .delete()
          .eq('user_id', userId);

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: `Failed to delete user: ${deleteError.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        deletedCount = 1;
      } else if (type === 'auth_without_user') {
        // Delete orphaned auth user
        const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId);
        
        if (deleteError) {
          return new Response(
            JSON.stringify({ error: `Failed to delete auth user: ${deleteError.message}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        deletedCount = 1;
      }

      // Log the cleanup action
      await supabaseClient
        .from('audit_logs')
        .insert({
          action: 'ORPHAN_CLEANUP',
          performed_by: userData.user_id,
          details: {
            deletedUserId: userId,
            type,
            deletedCount
          }
        });

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Orphaned record deleted successfully',
          deletedCount
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'cleanup-all') {
      const body = await req.json();
      const { type } = body;

      if (!type) {
        return new Response(
          JSON.stringify({ error: 'Missing type parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let deletedCount = 0;

      if (type === 'users') {
        // Get all orphaned user records
        const { data: allUsers } = await supabaseClient
          .from('users')
          .select('user_id, auth_user_id');

        if (allUsers) {
          for (const user of allUsers) {
            let isOrphaned = false;
            
            if (user.auth_user_id) {
              const { data: authUser } = await supabaseClient.auth.admin.getUserById(user.auth_user_id);
              if (!authUser.user) {
                isOrphaned = true;
              }
            } else {
              isOrphaned = true;
            }

            if (isOrphaned) {
              await supabaseClient.from('teachers').delete().eq('user_id', user.user_id);
              await supabaseClient.from('students').delete().eq('user_id', user.user_id);
              await supabaseClient.from('parents').delete().eq('user_id', user.user_id);
              await supabaseClient.from('user_roles').delete().eq('user_id', user.user_id);
              await supabaseClient.from('users').delete().eq('user_id', user.user_id);
              deletedCount++;
            }
          }
        }
      } else if (type === 'auth') {
        const { data: { users: authUsers } } = await supabaseClient.auth.admin.listUsers();
        
        for (const authUser of authUsers) {
          const { data: userRecord } = await supabaseClient
            .from('users')
            .select('user_id')
            .eq('auth_user_id', authUser.id)
            .maybeSingle();
          
          if (!userRecord) {
            await supabaseClient.auth.admin.deleteUser(authUser.id);
            deletedCount++;
          }
        }
      }

      // Log the bulk cleanup
      await supabaseClient
        .from('audit_logs')
        .insert({
          action: 'BULK_ORPHAN_CLEANUP',
          performed_by: userData.user_id,
          details: {
            type,
            deletedCount
          }
        });

      return new Response(
        JSON.stringify({ 
          success: true,
          message: `Cleaned up ${deletedCount} orphaned records`,
          deletedCount
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in admin-cleanup-orphans:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
