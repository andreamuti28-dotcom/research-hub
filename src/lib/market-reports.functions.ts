import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

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
