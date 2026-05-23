import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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

const recordSchema = z.object({
  visitorToken: z.string().trim().min(1).max(64).regex(/^[a-zA-Z0-9_-]+$/),
  path: z.string().trim().max(255).default("/"),
});

export const recordSiteVisit = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => recordSchema.parse(input))
  .handler(async ({ data }) => {
    await supabaseAdmin.from("site_visits").insert({
      visitor_token: data.visitorToken,
      path: data.path,
    });
    return { ok: true };
  });

export type SiteVisitsStats = {
  total: number;
  uniqueVisitors: number;
  last30Days: number;
  uniqueLast30Days: number;
  today: number;
};

export const getSiteVisitsStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SiteVisitsStats> => {
    await assertAdmin(context.userId);

    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sinceToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).toISOString();

    const [totalRes, last30Res, todayRes, tokensAllRes, tokens30Res] = await Promise.all([
      supabaseAdmin.from("site_visits").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("site_visits")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since30),
      supabaseAdmin
        .from("site_visits")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sinceToday),
      supabaseAdmin.from("site_visits").select("visitor_token").limit(50000),
      supabaseAdmin
        .from("site_visits")
        .select("visitor_token")
        .gte("created_at", since30)
        .limit(50000),
    ]);

    const uniqueAll = new Set(
      (tokensAllRes.data ?? [])
        .map((r) => r.visitor_token)
        .filter((t): t is string => !!t),
    ).size;
    const unique30 = new Set(
      (tokens30Res.data ?? [])
        .map((r) => r.visitor_token)
        .filter((t): t is string => !!t),
    ).size;

    return {
      total: totalRes.count ?? 0,
      uniqueVisitors: uniqueAll,
      last30Days: last30Res.count ?? 0,
      uniqueLast30Days: unique30,
      today: todayRes.count ?? 0,
    };
  });
