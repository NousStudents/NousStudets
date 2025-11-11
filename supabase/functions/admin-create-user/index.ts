import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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
    // Get authorization header and extract token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract Bearer token
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.error('Invalid authorization header format');
      return new Response(
        JSON.stringify({ error: 'Invalid authorization header format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase service role client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT token using service role client
    console.log('Verifying user token...');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      console.error('Auth verification failed:', userError?.message || 'No user found');
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

    // Comprehensive cleanup function for orphaned records
    const cleanupOrphanedRecords = async (userId: string, authUserId?: string) => {
      console.log('Starting comprehensive cleanup for user_id:', userId);
      
      // Delete all related records in proper order (children first, then parent)
      try {
        // 1. First get role-specific IDs to clean up foreign key references
        const { data: teacherData } = await supabaseClient
          .from('teachers')
          .select('teacher_id')
          .eq('user_id', userId)
          .maybeSingle();
          
        const { data: studentData } = await supabaseClient
          .from('students')
          .select('student_id')
          .eq('user_id', userId)
          .maybeSingle();
          
        const { data: parentData } = await supabaseClient
          .from('parents')
          .select('parent_id')
          .eq('user_id', userId)
          .maybeSingle();
        
        // 2. Clean up references in other tables
        if (parentData) {
          // Remove parent references from students
          await supabaseClient
            .from('students')
            .update({ parent_id: null })
            .eq('parent_id', parentData.parent_id);
        }
        
        if (teacherData) {
          // Remove teacher references from classes
          await supabaseClient
            .from('classes')
            .update({ class_teacher_id: null })
            .eq('class_teacher_id', teacherData.teacher_id);
        }
        
        // 3. Delete role-specific records
        await supabaseClient.from('teachers').delete().eq('user_id', userId);
        await supabaseClient.from('students').delete().eq('user_id', userId);
        await supabaseClient.from('parents').delete().eq('user_id', userId);
        
        // 4. Delete user roles
        await supabaseClient.from('user_roles').delete().eq('user_id', userId);
        
        // 5. Delete user record
        const { error: userDeleteError } = await supabaseClient
          .from('users')
          .delete()
          .eq('user_id', userId);
        
        if (userDeleteError) {
          console.error('Failed to delete user record:', userDeleteError);
          return { success: false, error: userDeleteError.message };
        }
        
        // 6. Delete auth user if provided
        if (authUserId) {
          const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(authUserId);
          if (authDeleteError) {
            console.error('Failed to delete auth user:', authDeleteError);
            // Don't return error here, user record is already deleted
          }
        }
        
        console.log('Successfully cleaned up all records for user:', userId);
        return { success: true };
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
        return { success: false, error: String(cleanupError) };
      }
    };

    // Step 1: Check for existing user in users table
    console.log('Checking for existing email in users table:', email);
    const { data: existingUserData, error: userCheckError } = await supabaseClient
      .from('users')
      .select('email, auth_user_id, user_id')
      .ilike('email', email.trim())
      .maybeSingle();
    
    if (userCheckError) {
      console.error('Error checking existing user:', userCheckError);
    }
    
    // Step 2: Check for existing auth user
    console.log('Checking for existing email in auth:', email);
    const { data: { users: authUsers }, error: authListError } = await supabaseClient.auth.admin.listUsers();
    if (authListError) {
      console.error('Error listing auth users:', authListError);
    }
    
    const existingAuthUser = authUsers?.find(u => 
      u.email?.toLowerCase().trim() === email.toLowerCase().trim()
    );
    
    console.log('Duplicate check results:', { 
      email: email.trim(), 
      foundInUsersTable: !!existingUserData,
      foundInAuth: !!existingAuthUser,
      userTableId: existingUserData?.user_id,
      authId: existingAuthUser?.id
    });

    // Step 3: Determine if user is valid or orphaned
    if (existingUserData && existingUserData.auth_user_id) {
      // User record has auth_user_id, verify it exists in auth
      const authUserExists = authUsers?.some(u => u.id === existingUserData.auth_user_id);
      
      if (authUserExists) {
        // VALID USER EXISTS - Cannot create duplicate
        console.log('Valid user found with this email - cannot create duplicate');
        return new Response(
          JSON.stringify({ 
            error: 'A user with this email already exists',
            details: 'This email is already registered. Please use a different email or contact support to remove the existing account.',
            existingUserId: existingUserData.user_id
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Orphaned: user record points to non-existent auth user
        console.log('Orphaned user detected: auth_user_id points to deleted auth user');
        const cleanupResult = await cleanupOrphanedRecords(existingUserData.user_id);
        if (!cleanupResult.success) {
          return new Response(
            JSON.stringify({ 
              error: 'Failed to clean up orphaned user record',
              details: cleanupResult.error
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        console.log('Successfully cleaned up orphaned user record');
      }
    } else if (existingUserData && !existingUserData.auth_user_id) {
      // Orphaned: user record without auth_user_id
      console.log('Orphaned user detected: no auth_user_id');
      const cleanupResult = await cleanupOrphanedRecords(existingUserData.user_id);
      if (!cleanupResult.success) {
        return new Response(
          JSON.stringify({ 
            error: 'Failed to clean up orphaned user record',
            details: cleanupResult.error
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Successfully cleaned up orphaned user record');
    }
    
    // Step 4: Check for orphaned auth user (exists in auth but not in users table)
    if (existingAuthUser && !existingUserData) {
      console.log('Orphaned auth user detected: exists in auth but not in users table');
      const { error: authDeleteError } = await supabaseClient.auth.admin.deleteUser(existingAuthUser.id);
      if (authDeleteError) {
        return new Response(
          JSON.stringify({ 
            error: 'Failed to clean up orphaned auth user',
            details: authDeleteError.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Successfully cleaned up orphaned auth user');
    }
    
    // Step 5: Final safety check before proceeding
    const { data: postCleanupCheck } = await supabaseClient
      .from('users')
      .select('user_id')
      .ilike('email', email.trim())
      .maybeSingle();
      
    if (postCleanupCheck) {
      console.error('CRITICAL: User still exists after cleanup');
      return new Response(
        JSON.stringify({ 
          error: 'Email validation failed',
          details: 'User record still exists after cleanup attempt. Please contact support or use the cleanup utility.',
          existingUserId: postCleanupCheck.user_id
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('All checks passed - proceeding with user creation');

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

    // Create or update user in public.users table (using upsert to handle trigger race condition)
    // Note: The handle_new_auth_user trigger may have already created a basic user record
    console.log('Creating/updating user record in users table for:', email);
    
    // First, check if trigger already created the user
    await new Promise(resolve => setTimeout(resolve, 100)); // Brief wait for trigger to complete
    
    const { data: triggerCreatedUser } = await supabaseClient
      .from('users')
      .select('user_id')
      .eq('auth_user_id', newAuthUser.user!.id)
      .maybeSingle();
    
    let newUser;
    let userInsertError;
    
    if (triggerCreatedUser) {
      // Trigger already created the user, update it with full details
      console.log('User record already created by trigger, updating...');
      const { data, error } = await supabaseClient
        .from('users')
        .update({
          full_name: fullName,
          phone: phone || null,
          role: role,
          school_id: schoolId,
          status: 'active'
        })
        .eq('user_id', triggerCreatedUser.user_id)
        .select()
        .single();
      
      newUser = data;
      userInsertError = error;
    } else {
      // Trigger hasn't created it yet, insert manually
      console.log('Creating new user record...');
      const { data, error } = await supabaseClient
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
      
      newUser = data;
      userInsertError = error;
    }

    if (userInsertError) {
      console.error('Error creating user record:', userInsertError);
      console.error('Full error details:', JSON.stringify(userInsertError, null, 2));
      
      // Cleanup: delete auth user if public user creation fails
      console.log('Cleaning up auth user due to failed user record creation');
      await supabaseClient.auth.admin.deleteUser(newAuthUser.user!.id);
      
      // Provide helpful error message
      let errorMessage = 'Failed to create user record.';
      if (userInsertError.code === '23505') {
        errorMessage = 'A user with this email already exists. Please use the Database Cleanup Utility to remove orphaned records if this error persists.';
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: userInsertError.message
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('User record created successfully:', newUser.user_id);

    // Assign role in user_roles table using upsert to prevent duplicates
    const { error: roleInsertError } = await supabaseClient
      .from('user_roles')
      .upsert({
        user_id: newUser.user_id,
        role: role,
        granted_by: userData.user_id
      }, {
        onConflict: 'user_id,role'
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

      // Link parent to students - ensure students belong to same school
      if (linkedStudents && linkedStudents.length > 0 && parentData) {
        // First verify all students belong to the same school
        const { data: studentsToLink } = await supabaseClient
          .from('students')
          .select('student_id, user_id')
          .in('student_id', linkedStudents);
        
        if (studentsToLink && studentsToLink.length > 0) {
          // Verify students belong to the same school by checking users table
          const { data: studentUsers } = await supabaseClient
            .from('users')
            .select('user_id')
            .in('user_id', studentsToLink.map(s => s.user_id))
            .eq('school_id', schoolId);
          
          if (studentUsers && studentUsers.length > 0) {
            // Only link students that belong to the same school
            const validStudentIds = studentsToLink
              .filter(s => studentUsers.some(u => u.user_id === s.user_id))
              .map(s => s.student_id);
            
            if (validStudentIds.length > 0) {
              const updates = validStudentIds.map(studentId =>
                supabaseClient
                  .from('students')
                  .update({ parent_id: parentData.parent_id })
                  .eq('student_id', studentId)
              );
              
              await Promise.all(updates);
              console.log(`Linked ${validStudentIds.length} students to parent`);
            }
          }
        }
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