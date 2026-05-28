import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { syncMarketReportFromGoogleDocInternal } from "@/lib/market-reports.functions";

type Schedule = "manual" | "hourly" | "daily" | "weekly";
const INTERVAL_MS: Record<Schedule, number | null> = {
  manual: null,
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey, Authorization",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

export const Route = createFileRoute("/api/public/hooks/market-sync")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async () => {
        const { data, error } = await supabaseAdmin
          .from("site_settings")
          .select("market_sync_schedule, market_last_sync_at, market_doc_id")
          .eq("singleton", true)
          .maybeSingle();
        if (error) return json({ error: error.message }, 500);
        const d = (data ?? {}) as Record<string, unknown>;
        const schedule = ((d.market_sync_schedule as string) || "manual") as Schedule;
        const interval = INTERVAL_MS[schedule];
        if (!interval) return json({ ok: true, skipped: "schedule_manual_or_off" });

        const last = d.market_last_sync_at ? new Date(d.market_last_sync_at as string).getTime() : 0;
        const due = Date.now() - last >= interval - 60_000; // 1 min slack
        if (!due) return json({ ok: true, skipped: "not_due", lastSyncAt: d.market_last_sync_at });

        try {
          const result = await syncMarketReportFromGoogleDocInternal();
          return json({ synced: true, ...result });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          return json({ ok: false, error: msg }, 500);
        }
      },
    },
  },
});
