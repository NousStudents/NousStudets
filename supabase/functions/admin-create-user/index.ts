import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  fullName: string;
  email: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  schoolId: string;
  password: string;
  sendPasswordResetEmail?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the requesting user is authenticated
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
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
      console.log('Access denied: User is not an admin');
      return new Response(
        JSON.stringify({ error: 'Access Denied: Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { fullName, email, role, schoolId, password, sendPasswordResetEmail }: CreateUserRequest = await req.json();

    // Validate input
    if (!fullName || !email || !role || !schoolId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create auth user
    const { data: newAuthUser, error: createError } = await supabaseClient.auth.admin.createUser({
      email,
      password: password || Math.random().toString(36).slice(-12) + 'A1!',
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role,
      }
    });

    if (createError) {
      console.error('Error creating auth user:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user in public.users table
    const { data: newUser, error: userInsertError } = await supabaseClient
      .from('users')
      .insert({
        auth_user_id: newAuthUser.user!.id,
        full_name: fullName,
        email: email,
        role: role,
        school_id: schoolId,
        status: 'active'
      })
      .select()
      .single();

    if (userInsertError) {
      console.error('Error creating user record:', userInsertError);
      // Cleanup: delete auth user if public user creation fails
      await supabaseClient.auth.admin.deleteUser(newAuthUser.user!.id);
      return new Response(
        JSON.stringify({ error: userInsertError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Assign role in user_roles table
    const { error: roleInsertError } = await supabaseClient
      .from('user_roles')
      .insert({
        user_id: newUser.user_id,
        role: role,
        granted_by: userData.user_id
      });

    if (roleInsertError) {
      console.error('Error assigning role:', roleInsertError);
    }

    // Create role-specific records
    if (role === 'teacher') {
      await supabaseClient.from('teachers').insert({
        user_id: newUser.user_id
      });
    } else if (role === 'student') {
      await supabaseClient.from('students').insert({
        user_id: newUser.user_id
      });
    } else if (role === 'parent') {
      await supabaseClient.from('parents').insert({
        user_id: newUser.user_id
      });
    }

    // Log the user creation
    await supabaseClient
      .from('audit_logs')
      .insert({
        action: 'USER_CREATED',
        performed_by: userData.user_id,
        target_user_id: newUser.user_id,
        details: {
          email,
          role,
          fullName,
          schoolId
        }
      });

    // Send password reset email if requested
    if (sendPasswordResetEmail) {
      await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${req.headers.get('origin')}/reset-password`
      });
    }

    console.log('User created successfully:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: newUser,
        message: 'User created successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in admin-create-user function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});