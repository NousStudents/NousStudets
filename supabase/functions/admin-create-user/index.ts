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
    // Validate env
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
      return new Response(JSON.stringify({ error: "Server misconfiguration: missing SUPABASE env vars" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth header
    const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      console.error("Invalid authorization header format");
      return new Response(JSON.stringify({ error: "Invalid authorization header format" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Safely get user
    console.log("Verifying user token...");
    const getUserRes = await supabaseClient.auth.getUser(token);
    if (getUserRes.error) {
      console.error("auth.getUser error:", getUserRes.error);
      return new Response(JSON.stringify({ error: "Unauthorized - Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = getUserRes.data?.user;
    if (!user) {
      console.error("auth.getUser returned no user:", JSON.stringify(getUserRes));
      return new Response(JSON.stringify({ error: "Unauthorized - No user" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log("User authenticated:", user.id, user.email);

    // Super admin check
    const saRes = await supabaseClient
      .from("super_admins")
      .select("super_admin_id")
      .eq("auth_user_id", user.id)
      .eq("status", "active")
      .maybeSingle();
    if (saRes.error) console.error("super_admins lookup error:", saRes.error);
    const isSuperAdmin = !!saRes.data;
    console.log("Is super admin:", isSuperAdmin);

    let adminData = null;
    if (!isSuperAdmin) {
      const adminRes = await supabaseClient
        .from("admins")
        .select("admin_id, school_id")
        .eq("auth_user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      if (adminRes.error) {
        console.error("admins lookup error:", adminRes.error);
        return new Response(JSON.stringify({ error: "Access Denied: Admin privileges required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!adminRes.data) {
        console.log("Access denied: not admin (no data returned)");
        return new Response(JSON.stringify({ error: "Access Denied: Admin privileges required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      adminData = adminRes.data;
    }

    const body = await req.json();
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
      occupation,
    } = body;

    if (!fullName || !email || !role || !schoolId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (adminData && schoolId !== adminData.school_id) {
      return new Response(JSON.stringify({ error: "Access Denied: Cannot create users for a different school" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // helper cleanup function (unchanged)
    const cleanupOrphanedRecords = async (userId: string, authUserId?: string) => {
      try {
        console.log("Starting cleanup for", userId);
        const t1 = await supabaseClient.from("teachers").select("teacher_id").eq("user_id", userId).maybeSingle();
        const t2 = await supabaseClient.from("students").select("student_id").eq("user_id", userId).maybeSingle();
        const t3 = await supabaseClient.from("parents").select("parent_id").eq("user_id", userId).maybeSingle();

        if (t3.data)
          await supabaseClient.from("students").update({ parent_id: null }).eq("parent_id", t3.data.parent_id);
        if (t1.data)
          await supabaseClient
            .from("classes")
            .update({ class_teacher_id: null })
            .eq("class_teacher_id", t1.data.teacher_id);

        await supabaseClient.from("teachers").delete().eq("user_id", userId);
        await supabaseClient.from("students").delete().eq("user_id", userId);
        await supabaseClient.from("parents").delete().eq("user_id", userId);

        const udel = await supabaseClient.from("users").delete().eq("user_id", userId);
        if (udel.error) {
          console.error("Failed to delete user record:", udel.error);
          return { success: false, error: udel.error.message };
        }
        if (authUserId) {
          const authDel = await supabaseClient.auth.admin.deleteUser(authUserId);
          if (authDel.error) console.error("Failed to delete auth user:", authDel.error);
        }
        return { success: true };
      } catch (e) {
        console.error("cleanup exception:", e);
        return { success: false, error: String(e) };
      }
    };

    // Check existing user in users table safely
    console.log("Checking for existing users table email:", email);
    const userCheck = await supabaseClient
      .from("users")
      .select("email, auth_user_id, user_id")
      .ilike("email", email.trim())
      .maybeSingle();
    if (userCheck.error) console.error("users table check error:", userCheck.error);

    // Check auth users list safely
    console.log("Listing auth users (this can be slow if you have many users)");
    const authListRes = await supabaseClient.auth.admin.listUsers();
    if (authListRes.error) console.error("auth.admin.listUsers error:", authListRes.error);
    const authUsers = authListRes.data?.users || [];

    const existingUserData = userCheck.data || null;
    const existingAuthUser =
      authUsers.find((u) => u.email?.toLowerCase().trim() === email.toLowerCase().trim()) || null;

    // (Then your orphan/dedup logic — same as before but using the safe variables)
    // ... for brevity, keep your subsequent logic, but ensure all usages of .data.* are protected
    // For example when creating new auth user:
    const passwordToUse = password || Math.random().toString(36).slice(-12) + "A1!";
    const createRes = await supabaseClient.auth.admin.createUser({
      email,
      password: passwordToUse,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    });
    if (createRes.error) {
      console.error("createUser error:", createRes.error);
      return new Response(JSON.stringify({ error: createRes.error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const newAuthUser = createRes.data?.user;
    if (!newAuthUser) {
      console.error("createUser returned no user", JSON.stringify(createRes));
      return new Response(JSON.stringify({ error: "Failed to create auth user" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Continue with the rest of your logic (creating users table entry, role-specific tables, audit logs).
    // Make sure every supabase call follows pattern:
    // const res = await supabaseClient.from('table').insert(...);
    // if (res.error) { console.error('...', res.error); /*cleanup*/ }

    // For the purpose of this snippet let's return success after auth user creation
    return new Response(JSON.stringify({ success: true, authUserId: newAuthUser.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in admin-create-user function:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
