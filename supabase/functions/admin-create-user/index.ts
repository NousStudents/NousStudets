import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Server misconfiguration" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the requesting user
    console.log("Verifying user token...");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }), 
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is super admin or admin
    const { data: superAdmin } = await supabaseClient
      .from("super_admins")
      .select("super_admin_id")
      .eq("auth_user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const isSuperAdmin = !!superAdmin;
    let adminData = null;

    if (!isSuperAdmin) {
      const { data: admin, error: adminError } = await supabaseClient
        .from("admins")
        .select("admin_id, school_id")
        .eq("auth_user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (adminError || !admin) {
        return new Response(
          JSON.stringify({ error: "Access Denied: Admin privileges required" }), 
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      adminData = admin;
    }

    // Parse request body
    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      role,
      password,
      schoolId,
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
      occupation,
    } = body;

    // Validate required fields
    if (!fullName || !email || !role || !schoolId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: fullName, email, role, schoolId" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate school access for non-super admins
    if (adminData && schoolId !== adminData.school_id) {
      return new Response(
        JSON.stringify({ error: "Access Denied: Cannot create users for a different school" }), 
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing user
    const { data: existingUser } = await supabaseClient
      .from("users")
      .select("email")
      .ilike("email", email.trim())
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "User with this email already exists" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user
    const passwordToUse = password || Math.random().toString(36).slice(-12) + "A1!";
    console.log("Creating auth user for:", email);
    
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password: passwordToUse,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });

    if (authError || !authUser?.user) {
      console.error("Failed to create auth user:", authError);
      return new Response(
        JSON.stringify({ error: authError?.message || "Failed to create auth user" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authUserId = authUser.user.id;
    console.log("Auth user created:", authUserId);

    try {
      // Create user in users table
      const { error: userInsertError } = await supabaseClient
        .from("users")
        .insert({
          auth_user_id: authUserId,
          email,
          full_name: fullName,
          phone: phone || null,
          role,
          school_id: schoolId,
          status: "active",
        });

      if (userInsertError) {
        console.error("Failed to create user record:", userInsertError);
        // Cleanup auth user
        await supabaseClient.auth.admin.deleteUser(authUserId);
        return new Response(
          JSON.stringify({ error: "Failed to create user record: " + userInsertError.message }), 
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create role-specific record
      if (role === "student") {
        const { error: studentError } = await supabaseClient
          .from("students")
          .insert({
            auth_user_id: authUserId,
            email,
            full_name: fullName,
            phone: phone || null,
            class_id: classId || null,
            section: section || null,
            roll_no: rollNo || null,
            dob: dob || null,
            gender: gender || null,
            admission_date: admissionDate || null,
            status: "active",
          });

        if (studentError) {
          console.error("Failed to create student record:", studentError);
          await supabaseClient.from("users").delete().eq("auth_user_id", authUserId);
          await supabaseClient.auth.admin.deleteUser(authUserId);
          return new Response(
            JSON.stringify({ error: "Failed to create student record: " + studentError.message }), 
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (role === "teacher") {
        const { error: teacherError } = await supabaseClient
          .from("teachers")
          .insert({
            auth_user_id: authUserId,
            email,
            full_name: fullName,
            phone: phone || null,
            school_id: schoolId,
            qualification: qualification || null,
            experience: experience || null,
            subject_specialization: subjectSpecialization || null,
            status: "active",
          });

        if (teacherError) {
          console.error("Failed to create teacher record:", teacherError);
          await supabaseClient.from("users").delete().eq("auth_user_id", authUserId);
          await supabaseClient.auth.admin.deleteUser(authUserId);
          return new Response(
            JSON.stringify({ error: "Failed to create teacher record: " + teacherError.message }), 
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else if (role === "parent") {
        const { data: parentData, error: parentError } = await supabaseClient
          .from("parents")
          .insert({
            auth_user_id: authUserId,
            email,
            full_name: fullName,
            phone: phone || null,
            school_id: schoolId,
            relation: relation || null,
            occupation: occupation || null,
            status: "active",
          })
          .select()
          .single();

        if (parentError) {
          console.error("Failed to create parent record:", parentError);
          await supabaseClient.from("users").delete().eq("auth_user_id", authUserId);
          await supabaseClient.auth.admin.deleteUser(authUserId);
          return new Response(
            JSON.stringify({ error: "Failed to create parent record: " + parentError.message }), 
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Link students to parent if provided
        if (linkedStudents && linkedStudents.length > 0 && parentData) {
          const { error: linkError } = await supabaseClient
            .from("students")
            .update({ parent_id: parentData.parent_id })
            .in("student_id", linkedStudents);

          if (linkError) {
            console.error("Failed to link students to parent:", linkError);
          }
        }
      } else if (role === "admin") {
        const { error: adminError } = await supabaseClient
          .from("admins")
          .insert({
            auth_user_id: authUserId,
            email,
            full_name: fullName,
            phone: phone || null,
            school_id: schoolId,
            status: "active",
          });

        if (adminError) {
          console.error("Failed to create admin record:", adminError);
          await supabaseClient.from("users").delete().eq("auth_user_id", authUserId);
          await supabaseClient.auth.admin.deleteUser(authUserId);
          return new Response(
            JSON.stringify({ error: "Failed to create admin record: " + adminError.message }), 
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      // Log the action
      await supabaseClient.from("audit_logs").insert({
        action: `Created ${role} user`,
        performed_by: user.id,
        target_user_id: authUserId,
        details: { email, full_name: fullName, role },
      });

      console.log(`Successfully created ${role} user:`, email);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          authUserId,
          message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`
        }), 
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (error) {
      console.error("Error during user creation:", error);
      // Cleanup
      await supabaseClient.from("users").delete().eq("auth_user_id", authUserId);
      await supabaseClient.auth.admin.deleteUser(authUserId);
      throw error;
    }

  } catch (error) {
    console.error("Error in admin-create-user function:", error);
    return new Response(
      JSON.stringify({ error: String(error) }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
