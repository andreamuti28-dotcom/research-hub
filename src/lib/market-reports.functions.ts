import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchGoogleDocAsText } from "./google-docs.server";

const REPORT_TITLE = "Report giornaliero";

/**
 * Internal: fetch the configured Google Doc and write a new "current" report.
 * Stores the document as plain text, fixed title "Report giornaliero", no source.
 */
export async function syncMarketReportFromGoogleDocInternal(opts?: {
  documentId?: string;
}): Promise<{ ok: true; title: string; documentId: string; syncedAt: string }> {
  const { data: settings } = await supabaseAdmin
    .from("site_settings")
    .select("market_doc_id")
    .eq("singleton", true)
    .maybeSingle();
  const docId =
    opts?.documentId?.trim() ||
    (settings as { market_doc_id?: string } | null)?.market_doc_id ||
    "";
  if (!docId) throw new Error("Nessun ID Google Doc configurato.");

  const doc = await fetchGoogleDocAsText(docId);
  if (!doc.text.trim()) throw new Error("Il documento Google è vuoto.");

  const { error: demoteErr } = await supabaseAdmin
    .from("market_reports")
    .update({ is_current: false })
    .eq("is_current", true);
  if (demoteErr) throw new Error(demoteErr.message);

  const today = new Date().toISOString().slice(0, 10);
  const { error: insertErr } = await supabaseAdmin.from("market_reports").insert({
    title: REPORT_TITLE,
    content: doc.text,
    report_date: today,
    source: null,
    is_current: true,
  });
  if (insertErr) throw new Error(insertErr.message);

  const syncedAt = new Date().toISOString();
  await supabaseAdmin
    .from("site_settings")
    .update({
      market_last_sync_at: syncedAt,
      market_last_sync_file: doc.title,
      market_doc_id: doc.documentId,
    })
    .eq("singleton", true);

  return { ok: true, title: doc.title, documentId: doc.documentId, syncedAt };
}

export const syncMarketReportFromGoogleDoc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ documentId: z.string().trim().min(10).max(200).optional() })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    return syncMarketReportFromGoogleDocInternal({ documentId: data.documentId });
  });

export const SCHEDULE_VALUES = ["manual", "hourly", "daily", "weekly", "weekdays_7am", "daily_7am"] as const;
export type MarketSchedule = (typeof SCHEDULE_VALUES)[number];

const marketSyncConfigSchema = z.object({
  marketDocId: z.string().trim().min(10).max(200),
  marketSyncSchedule: z.enum(SCHEDULE_VALUES),
});

export const updateMarketSyncConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => marketSyncConfigSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("site_settings")
      .update({
        market_doc_id: data.marketDocId,
        market_sync_schedule: data.marketSyncSchedule,
      })
      .eq("singleton", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type MarketSyncStatus = {
  marketDocId: string;
  marketSyncSchedule: MarketSchedule;
  lastSyncAt: string | null;
  lastSyncFile: string | null;
};

export const getMarketSyncStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MarketSyncStatus> => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("market_doc_id, market_sync_schedule, market_last_sync_at, market_last_sync_file")
      .eq("singleton", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const d = (data ?? {}) as Record<string, unknown>;
    const sched = (d.market_sync_schedule as string) || "daily_7am";
    return {
      marketDocId: (d.market_doc_id as string) || "1vqcD0XRhjqMPyX2JsB99Sk_zlCU_xaJU9Obve_lV3q8",
      marketSyncSchedule: (SCHEDULE_VALUES.includes(sched as MarketSchedule)
        ? sched
        : "daily_7am") as MarketSchedule,
      lastSyncAt: (d.market_last_sync_at as string | null) ?? null,
      lastSyncFile: (d.market_last_sync_file as string | null) ?? null,
    };
  });

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

    const { error: demoteErr } = await supabaseAdmin
      .from("market_reports")
      .update({ is_current: false })
      .eq("is_current", true);
    if (demoteErr) throw new Error(demoteErr.message);

    const { error } = await supabaseAdmin.from("market_reports").insert({
      title: data.title,
      content: data.content,
      report_date: reportDate,
      source: data.source ?? null,
      is_current: true,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(300),
  content: z.string().trim().min(1).max(200_000),
  reportDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const updateMarketReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("market_reports")
      .update({
        title: data.title,
        content: data.content,
        report_date: data.reportDate,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMarketReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("market_reports")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export type MarketReport = {
  id: string;
  reportDate: string;
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
