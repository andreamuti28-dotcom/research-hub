import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export interface AdminUserRow {
  id: string;
  email: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  emailConfirmedAt: string | null;
  provider: string | null;
  role: "admin" | "user" | null;
}

export const listAuthUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context.userId);

    // Pull pages until we have everyone (capped to avoid runaway loops).
    const all: Array<{
      id: string;
      email?: string | null;
      created_at: string;
      last_sign_in_at?: string | null;
      email_confirmed_at?: string | null;
      app_metadata?: { provider?: string } | null;
    }> = [];
    const perPage = 200;
    for (let page = 1; page <= 25; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) throw new Error(error.message);
      all.push(...(data?.users ?? []));
      if (!data?.users || data.users.length < perPage) break;
    }

    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (rolesErr) throw new Error(rolesErr.message);
    const roleByUser = new Map<string, "admin" | "user">();
    for (const r of roles ?? []) {
      const current = roleByUser.get(r.user_id);
      if (r.role === "admin" || !current) {
        roleByUser.set(r.user_id, r.role as "admin" | "user");
      }
    }

    return all
      .map((u) => ({
        id: u.id,
        email: u.email ?? null,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        emailConfirmedAt: u.email_confirmed_at ?? null,
        provider: u.app_metadata?.provider ?? null,
        role: roleByUser.get(u.id) ?? null,
      }))
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  });
