import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateUserRequest {
  fullName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'teacher' | 'student' | 'parent';
  schoolId: string;
  password: string;
  sendPasswordResetEmail?: boolean;
  // Student fields
  classId?: string | null;
  section?: string;
  rollNo?: string;
  dob?: string;
  gender?: string;
  admissionDate?: string;
  // Teacher fields
  qualification?: string | null;
  experience?: number;
  subjectSpecialization?: string;
  // Parent fields
  linkedStudents?: string[];
  relation?: string;
  occupation?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header first
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JWT token from Authorization header
    const token = authHeader.replace('Bearer ', '');

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT token using service role client
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth verification failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User authenticated:', user.id, user.email);

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
    const { 
      fullName, 
      email,
      phone,
      role, 
      schoolId, 
      password, 
      sendPasswordResetEmail,
      classId,
      section,
      rollNo,
      dob,
      gender,
      admissionDate,
      qualification,
      experience,
      subjectSpecialization,
      linkedStudents,
      relation,
      occupation
    }: CreateUserRequest = await req.json();

    // Validate input
    if (!fullName || !email || !role || !schoolId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email already exists in users table (case-insensitive)
    const { data: existingUser } = await supabaseClient
      .from('users')
      .select('email, auth_user_id, user_id')
      .ilike('email', email)
      .maybeSingle();

    if (existingUser) {
      // Check if this is an orphaned record (no auth user)
      if (existingUser.auth_user_id) {
        const { data: authUser } = await supabaseClient.auth.admin.getUserById(existingUser.auth_user_id);
        
        if (!authUser.user) {
          // Orphaned record - delete role and user records
          console.log('Found orphaned user record, cleaning up:', email);
          await supabaseClient.from('user_roles').delete().eq('user_id', existingUser.user_id);
          await supabaseClient.from('users').delete().eq('user_id', existingUser.user_id);
        } else {
          return new Response(
            JSON.stringify({ error: 'A user with this email already exists' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        // No auth_user_id at all - orphaned record
        console.log('Found orphaned user record without auth_user_id, cleaning up:', email);
        await supabaseClient.from('user_roles').delete().eq('user_id', existingUser.user_id);
        await supabaseClient.from('users').delete().eq('user_id', existingUser.user_id);
      }
    }

    // Also check if email exists in auth.users
    try {
      const { data: { users: authUsers } } = await supabaseClient.auth.admin.listUsers();
      const existingAuthUser = authUsers.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (existingAuthUser) {
        // Check if this auth user has a corresponding users record
        const { data: userRecord } = await supabaseClient
          .from('users')
          .select('user_id')
          .eq('auth_user_id', existingAuthUser.id)
          .maybeSingle();
        
        if (!userRecord) {
          // Auth user exists but no users record - delete the auth user
          console.log('Found orphaned auth user, cleaning up:', email);
          await supabaseClient.auth.admin.deleteUser(existingAuthUser.id);
        } else {
          return new Response(
            JSON.stringify({ error: 'A user with this email already exists in the authentication system' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    } catch (authCheckError) {
      console.error('Error checking auth users:', authCheckError);
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
        phone: phone || null,
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
      const { error: teacherError } = await supabaseClient
        .from('teachers')
        .insert({
          user_id: newUser.user_id,
          school_id: schoolId,
          qualification: qualification || null,
          experience: experience || null,
          subject_specialization: subjectSpecialization || null,
        });

      if (teacherError) {
        console.error('Error creating teacher record:', teacherError);
        // Cleanup: delete user records if teacher creation fails
        await supabaseClient.from('user_roles').delete().eq('user_id', newUser.user_id);
        await supabaseClient.from('users').delete().eq('user_id', newUser.user_id);
        await supabaseClient.auth.admin.deleteUser(newAuthUser.user!.id);
        return new Response(
          JSON.stringify({ error: `Failed to create teacher: ${teacherError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (role === 'student') {
      const { error: studentError } = await supabaseClient
        .from('students')
        .insert({
          user_id: newUser.user_id,
          class_id: classId || null,
          section: section || null,
          roll_no: rollNo || null,
          dob: dob || null,
          gender: gender || null,
          admission_date: admissionDate || null,
        });

      if (studentError) {
        console.error('Error creating student record:', studentError);
        // Cleanup
        await supabaseClient.from('user_roles').delete().eq('user_id', newUser.user_id);
        await supabaseClient.from('users').delete().eq('user_id', newUser.user_id);
        await supabaseClient.auth.admin.deleteUser(newAuthUser.user!.id);
        return new Response(
          JSON.stringify({ error: `Failed to create student: ${studentError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (role === 'parent') {
      const { data: parentData, error: parentError } = await supabaseClient
        .from('parents')
        .insert({
          user_id: newUser.user_id,
          relation: relation || null,
          occupation: occupation || null,
        })
        .select()
        .single();

      if (parentError) {
        console.error('Error creating parent record:', parentError);
        // Cleanup
        await supabaseClient.from('user_roles').delete().eq('user_id', newUser.user_id);
        await supabaseClient.from('users').delete().eq('user_id', newUser.user_id);
        await supabaseClient.auth.admin.deleteUser(newAuthUser.user!.id);
        return new Response(
          JSON.stringify({ error: `Failed to create parent: ${parentError.message}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Link parent to students
      if (linkedStudents && linkedStudents.length > 0 && parentData) {
        const updates = linkedStudents.map(studentId =>
          supabaseClient
            .from('students')
            .update({ parent_id: parentData.parent_id })
            .eq('student_id', studentId)
        );
        
        await Promise.all(updates);
      }
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