// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient, type User as GoTrueUser } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
} as const;

type OrphanedUserRow = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  auth_user_id: string | null;
  created_at: string;
  role?: string | null; // if present in your schema
};

type OrphanRecord =
  | (OrphanedUserRow & {
      type: "user_without_auth" | "user_without_auth_id";
      reason: string;
    })
  | {
      auth_user_id: string;
      email: string | null;
      created_at: string;
      type: "auth_without_user";
      reason: string;
    };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAllAuthUsers(supabase: any): Promise<GoTrueUser[]> {
  // Paginate to avoid timeouts and N+1 calls
  const perPage = 1000;
  let page = 1;
  const all: GoTrueUser[] = [];
  // @ts-ignore listUsers accepts page/perPage in v2
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = (data?.users ?? []) as GoTrueUser[];
    all.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }
  return all;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Missing or invalid authorization header" }, 401);
    }
    const token = authHeader.slice("Bearer ".length);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!supabaseUrl || !supabaseServiceKey) {
      return json({ error: "Server misconfiguration" }, 500);
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the caller
    const {
      data: { user: authUser },
      error: authErr,
    } = await supabase.auth.getUser(token);
    if (authErr || !authUser) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Map auth user -> app user (and require admin)
    const { data: userRow, error: userMapErr } = await supabase
      .from("users")
      .select("user_id, email")
      .eq("auth_user_id", authUser.id)
      .single();

    if (userMapErr || !userRow) {
      return json({ error: "User not found" }, 404);
    }

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userRow.user_id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleRow) {
      return json({ error: "Access Denied: Admin privileges required" }, 403);
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "list";

    // Helpers for auditing
    const audit = async (actionName: string, details: Record<string, unknown>) => {
      try {
        await supabase.from("audit_logs").insert({
          action: actionName,
          performed_by: userRow.user_id,
          details,
        });
      } catch {
        // non-fatal
      }
    };

    if (action === "list") {
      // Load app users once
      const { data: appUsers, error: appUsersErr } = await supabase
        .from("users")
        .select("user_id, email, full_name, auth_user_id, created_at, role");
      if (appUsersErr) return json({ error: appUsersErr.message }, 400);

      // Build sets to compare
      const appAuthIds = new Set((appUsers ?? []).map((u) => u.auth_user_id).filter((v): v is string => !!v));

      // Fetch all auth users once
      const allAuthUsers = await fetchAllAuthUsers(supabase);
      const authIds = new Set(allAuthUsers.map((u) => u.id));

      const orphanedUsers: OrphanRecord[] = [];
      for (const u of appUsers ?? []) {
        if (!u.auth_user_id) {
          orphanedUsers.push({
            ...u,
            type: "user_without_auth_id",
            reason: "User record has no auth_user_id",
          });
        } else if (!authIds.has(u.auth_user_id)) {
          orphanedUsers.push({
            ...u,
            type: "user_without_auth",
            reason: "User record exists but auth user was deleted",
          });
        }
      }

      const orphanedAuthUsers: OrphanRecord[] = [];
      for (const au of allAuthUsers) {
        if (!appAuthIds.has(au.id)) {
          orphanedAuthUsers.push({
            auth_user_id: au.id,
            email: au.email ?? null,
            created_at: au.created_at,
            type: "auth_without_user",
            reason: "Auth user exists but no user record in database",
          });
        }
      }

      return json({
        orphanedUsers,
        orphanedAuthUsers,
        summary: {
          totalOrphanedUsers: orphanedUsers.length,
          totalOrphanedAuthUsers: orphanedAuthUsers.length,
          total: orphanedUsers.length + orphanedAuthUsers.length,
        },
      });
    }

    if (action === "cleanup") {
      const body = (await req.json().catch(() => ({}))) as {
        userId?: string; // user_id (for users table) OR auth_user_id (for auth)
        type?: "user_without_auth" | "user_without_auth_id" | "auth_without_user";
        dryRun?: boolean;
      };

      const { userId, type, dryRun = false } = body;
      if (!userId || !type) {
        return json({ error: "Missing userId or type" }, 400);
      }

      if (dryRun) {
        return json({
          success: true,
          dryRun: true,
          message:
            type === "auth_without_user"
              ? `Would delete auth user ${userId}`
              : `Would delete app user ${userId} (+ roles & role-specific records)`,
        });
      }

      let deletedCount = 0;

      if (type === "auth_without_user") {
        // Avoid deleting yourself accidentally
        if (userId === authUser.id) {
          return json({ error: "Refusing to delete the currently authenticated admin user" }, 400);
        }
        const { error: delErr } = await supabase.auth.admin.deleteUser(userId);
        if (delErr) return json({ error: `Failed to delete auth user: ${delErr.message}` }, 400);
        deletedCount = 1;
      } else {
        // Defensive cascade for app user rows
        const uid = userId;
        const deletions = [
          supabase.from("teachers").delete().eq("user_id", uid),
          supabase.from("students").delete().eq("user_id", uid),
          supabase.from("parents").delete().eq("user_id", uid),
          supabase.from("user_roles").delete().eq("user_id", uid),
        ];
        await Promise.allSettled(deletions);

        const { error: delErr } = await supabase.from("users").delete().eq("user_id", uid);
        if (delErr) return json({ error: `Failed to delete user: ${delErr.message}` }, 400);
        deletedCount = 1;
      }

      await audit("ORPHAN_CLEANUP", { type, deletedUserId: userId, deletedCount });

      return json({
        success: true,
        message: "Orphaned record deleted successfully",
        deletedCount,
      });
    }

    if (action === "cleanup-all") {
      const body = (await req.json().catch(() => ({}))) as {
        type?: "users" | "auth";
        dryRun?: boolean;
      };
      const { type, dryRun = false } = body;
      if (!type) return json({ error: "Missing type parameter" }, 400);

      let deletedCount = 0;
      const deletedIds: string[] = [];

      if (type === "users") {
        const { data: appUsers, error: appErr } = await supabase.from("users").select("user_id, auth_user_id");
        if (appErr) return json({ error: appErr.message }, 400);

        const allAuthUsers = await fetchAllAuthUsers(supabase);
        const authIds = new Set(allAuthUsers.map((u) => u.id));

        const orphanUserIds = (appUsers ?? [])
          .filter((u) => !u.auth_user_id || !authIds.has(u.auth_user_id))
          .map((u) => u.user_id);

        if (dryRun) {
          return json({
            success: true,
            dryRun: true,
            type,
            wouldDelete: orphanUserIds,
            count: orphanUserIds.length,
          });
        }

        if (orphanUserIds.length > 0) {
          // Batch deletes (best-effort)
          await Promise.allSettled([
            supabase.from("teachers").delete().in("user_id", orphanUserIds),
            supabase.from("students").delete().in("user_id", orphanUserIds),
            supabase.from("parents").delete().in("user_id", orphanUserIds),
            supabase.from("user_roles").delete().in("user_id", orphanUserIds),
          ]);
          await supabase.from("users").delete().in("user_id", orphanUserIds);
          deletedCount = orphanUserIds.length;
          deletedIds.push(...orphanUserIds);
        }
      } else if (type === "auth") {
        const { data: appUsers, error: appErr } = await supabase.from("users").select("auth_user_id");
        if (appErr) return json({ error: appErr.message }, 400);
        const appAuthIds = new Set((appUsers ?? []).map((u) => u.auth_user_id).filter((v): v is string => !!v));

        const allAuthUsers = await fetchAllAuthUsers(supabase);
        const orphanAuthIds = allAuthUsers.filter((u) => !appAuthIds.has(u.id)).map((u) => u.id);

        if (dryRun) {
          return json({
            success: true,
            dryRun: true,
            type,
            wouldDelete: orphanAuthIds,
            count: orphanAuthIds.length,
          });
        }

        // Delete sequentially to avoid hitting rate limits
        for (const id of orphanAuthIds) {
          if (id === authUser.id) continue; // never delete yourself
          // eslint-disable-next-line no-await-in-loop
          const { error: delErr } = await supabase.auth.admin.deleteUser(id);
          if (!delErr) {
            deletedCount += 1;
            deletedIds.push(id);
          }
        }
      }

      await audit("BULK_ORPHAN_CLEANUP", { type, deletedCount, deletedIds });

      return json({
        success: true,
        message: `Cleaned up ${deletedCount} orphaned records`,
        deletedCount,
        deletedIds,
      });
    }

    // NEW: reconcile links between Auth and App by email (prevents duplicate email errors elsewhere)
    if (action === "reconcile") {
      const body = (await req.json().catch(() => ({}))) as { dryRun?: boolean };
      const { dryRun = false } = body;

      // Pull all app users (need email + auth_user_id)
      const { data: appUsers, error: appErr } = await supabase
        .from("users")
        .select("user_id, email, full_name, auth_user_id");
      if (appErr) return json({ error: appErr.message }, 400);

      // Pull all auth users once
      const allAuthUsers = await fetchAllAuthUsers(supabase);

      // Build lookups
      const authById = new Map(allAuthUsers.map((u) => [u.id, u]));
      const authByEmail = new Map(allAuthUsers.filter((u) => !!u.email).map((u) => [u.email!.toLowerCase(), u]));
      const appByAuthId = new Map((appUsers ?? []).filter((u) => !!u.auth_user_id).map((u) => [u.auth_user_id!, u]));
      const appByEmail = new Map((appUsers ?? []).filter((u) => !!u.email).map((u) => [u.email!.toLowerCase(), u]));

      // Plan changes
      const backfilledAuthIds: Array<{ user_id: string; email: string | null; auth_user_id: string }> = [];
      const relinkedAuthIds: Array<{
        user_id: string;
        email: string | null;
        old_auth_user_id: string | null;
        new_auth_user_id: string;
      }> = [];
      const createdAppRows: Array<{ email: string; auth_user_id: string; user_id?: string }> = [];

      // 1) Backfill users.auth_user_id when null but email matches an existing Auth user
      for (const u of appUsers ?? []) {
        if (!u.email) continue;
        if (!u.auth_user_id) {
          const match = authByEmail.get(u.email.toLowerCase());
          if (match) {
            backfilledAuthIds.push({ user_id: u.user_id, email: u.email, auth_user_id: match.id });
          }
        }
      }

      // 2) Relink users.auth_user_id if it points to a missing/deleted Auth user but email matches a valid Auth user
      for (const u of appUsers ?? []) {
        if (!u.email) continue;
        if (u.auth_user_id && !authById.has(u.auth_user_id)) {
          const match = authByEmail.get(u.email.toLowerCase());
          if (match) {
            relinkedAuthIds.push({
              user_id: u.user_id,
              email: u.email,
              old_auth_user_id: u.auth_user_id,
              new_auth_user_id: match.id,
            });
          }
        }
      }

      // 3) For Auth users with no users row, upsert a users row by email (prevents future duplicate email errors)
      for (const au of allAuthUsers) {
        const emailKey = (au.email ?? "").toLowerCase();
        if (!emailKey) continue;
        const existing = appByEmail.get(emailKey);
        if (!existing) {
          createdAppRows.push({ email: au.email!, auth_user_id: au.id });
        }
      }

      if (dryRun) {
        return json({
          success: true,
          dryRun: true,
          summary: {
            willBackfill: backfilledAuthIds.length,
            willRelink: relinkedAuthIds.length,
            willCreateAppRows: createdAppRows.length,
          },
          details: { backfilledAuthIds, relinkedAuthIds, createdAppRows },
        });
      }

      // Execute changes
      // 1) Backfill
      for (const b of backfilledAuthIds) {
        // eslint-disable-next-line no-await-in-loop
        await supabase.from("users").update({ auth_user_id: b.auth_user_id }).eq("user_id", b.user_id);
      }

      // 2) Relink
      for (const r of relinkedAuthIds) {
        // eslint-disable-next-line no-await-in-loop
        await supabase.from("users").update({ auth_user_id: r.new_auth_user_id }).eq("user_id", r.user_id);
      }

      // 3) Create users rows by email via upsert (idempotent, avoids users_email_key violation)
      for (const c of createdAppRows) {
        // eslint-disable-next-line no-await-in-loop
        await supabase
          .from("users")
          .upsert([{ email: c.email, auth_user_id: c.auth_user_id }], { onConflict: "email" });
      }

      const summary = {
        backfilled: backfilledAuthIds.length,
        relinked: relinkedAuthIds.length,
        created: createdAppRows.length,
        totalChanges: backfilledAuthIds.length + relinkedAuthIds.length + createdAppRows.length,
      };

      await audit("RECONCILE_LINKS", { summary });

      return json({ success: true, message: "Reconciliation completed", summary });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err: any) {
    console.error("Error in admin-cleanup-orphans:", err);
    return json({ error: err?.message ?? "Internal Server Error" }, 500);
  }
});
