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

const upsertSchema = z.object({
  title: z.string().trim().min(1).max(300),
  content: z.string().trim().min(1).max(200_000),
  reportDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  source: z.string().trim().max(200).nullable().optional(),
});

export const upsertCurrentMarketReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => upsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const reportDate = data.reportDate ?? new Date().toISOString().slice(0, 10);

    const { data: existing } = await supabaseAdmin
      .from("market_reports")
      .select("id")
      .eq("is_current", true)
      .maybeSingle();

    if (existing) {
      const { error } = await supabaseAdmin
        .from("market_reports")
        .update({
          title: data.title,
          content: data.content,
          report_date: reportDate,
          source: data.source ?? null,
        })
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("market_reports").insert({
        title: data.title,
        content: data.content,
        report_date: reportDate,
        source: data.source ?? null,
        is_current: true,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export type MarketReport = {
  id: string;
  reportDate: string; // ISO date
  title: string;
  content: string;
  source: string | null;
  createdAt: string;
  isCurrent: boolean;
};

function rowToReport(r: Record<string, unknown>): MarketReport {
  return {
    id: r.id as string,
    reportDate: r.report_date as string,
    title: (r.title as string) ?? "",
    content: (r.content as string) ?? "",
    source: (r.source as string | null) ?? null,
    createdAt: r.created_at as string,
    isCurrent: Boolean(r.is_current),
  };
}

export const getLatestMarketReport = createServerFn({ method: "GET" }).handler(
  async (): Promise<MarketReport | null> => {
    const { data, error } = await supabaseAdmin
      .from("market_reports")
      .select("*")
      .order("is_current", { ascending: false })
      .order("report_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? rowToReport(data as Record<string, unknown>) : null;
  },
);

export const listArchivedMarketReports = createServerFn({ method: "GET" }).handler(
  async (): Promise<MarketReport[]> => {
    const { data, error } = await supabaseAdmin
      .from("market_reports")
      .select("*")
      .order("report_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, unknown>[]).map(rowToReport);
  },
);
