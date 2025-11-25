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
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server misconfiguration" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json();
    const { email, password, fullName, schoolId } = body;

    // Validate required fields
    if (!email || !password || !fullName || !schoolId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email, password, fullName, schoolId" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Checking whitelist for parent email:", email, "school:", schoolId);

    // Check if email is whitelisted for this school
    const { data: whitelistEntry, error: whitelistError } = await supabaseClient
      .from("whitelisted_parents")
      .select("id, full_name, phone, relation, student_ids")
      .eq("school_id", schoolId)
      .ilike("email", email.trim())
      .maybeSingle();

    if (whitelistError) {
      console.error("Whitelist check error:", whitelistError);
      return new Response(
        JSON.stringify({ error: "Failed to verify email registration" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!whitelistEntry) {
      console.log("Email not whitelisted:", email);
      return new Response(
        JSON.stringify({ error: "Your email is not registered as a parent. Please contact school admin." }), 
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email whitelisted, creating account...");

    // Check for existing user
    const { data: existingUser } = await supabaseClient
      .from("users")
      .select("email")
      .ilike("email", email.trim())
      .maybeSingle();

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "An account with this email already exists" }), 
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { 
        full_name: fullName, 
        role: "parent" 
      },
    });

    if (authError || !authUser?.user) {
      console.error("Failed to create auth user:", authError);
      return new Response(
        JSON.stringify({ error: authError?.message || "Failed to create account" }), 
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
          role: "parent",
          school_id: schoolId,
          status: "active",
        });

      if (userInsertError) {
        console.error("Failed to create user record:", userInsertError);
        await supabaseClient.auth.admin.deleteUser(authUserId);
        return new Response(
          JSON.stringify({ error: "Failed to create user record: " + userInsertError.message }), 
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create parent record with whitelisted data
      const { data: parentData, error: parentError } = await supabaseClient
        .from("parents")
        .insert({
          auth_user_id: authUserId,
          email,
          full_name: fullName,
          school_id: schoolId,
          phone: whitelistEntry.phone,
          relation: whitelistEntry.relation,
          status: "active",
        })
        .select()
        .single();

      if (parentError || !parentData) {
        console.error("Failed to create parent record:", parentError);
        await supabaseClient.from("users").delete().eq("auth_user_id", authUserId);
        await supabaseClient.auth.admin.deleteUser(authUserId);
        return new Response(
          JSON.stringify({ error: "Failed to create parent record: " + parentError?.message }), 
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Link parent to students
      if (whitelistEntry.student_ids && whitelistEntry.student_ids.length > 0) {
        const { error: linkError } = await supabaseClient
          .from("students")
          .update({ parent_id: parentData.parent_id })
          .in("student_id", whitelistEntry.student_ids);

        if (linkError) {
          console.error("Failed to link parent to students:", linkError);
          // Continue anyway - parent account is created
        }
      }

      console.log("Parent account created successfully");
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Account created successfully. You can now log in."
        }), 
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } catch (error) {
      console.error("Error during account creation:", error);
      await supabaseClient.from("users").delete().eq("auth_user_id", authUserId);
      await supabaseClient.auth.admin.deleteUser(authUserId);
      return new Response(
        JSON.stringify({ error: "Account creation failed" }), 
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error("Error in parent-signup function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }), 
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
