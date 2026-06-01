import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { syncMarketReportFromGoogleDocInternal } from "@/lib/market-reports.functions";

type Schedule = "manual" | "hourly" | "daily" | "weekly" | "weekdays_7am";

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

// Returns true if cron should fire now for this schedule (Europe/Rome).
function isDue(schedule: Schedule, lastSyncAt: string | null): boolean {
  const now = new Date();
  switch (schedule) {
    case "manual":
      return false;
    case "hourly":
      return !lastSyncAt || now.getTime() - new Date(lastSyncAt).getTime() >= 60 * 60 * 1000 - 60_000;
    case "daily":
      return !lastSyncAt || now.getTime() - new Date(lastSyncAt).getTime() >= 24 * 60 * 60 * 1000 - 60_000;
    case "weekly":
      return !lastSyncAt || now.getTime() - new Date(lastSyncAt).getTime() >= 7 * 24 * 60 * 60 * 1000 - 60_000;
    case "weekdays_7am": {
      // Run only Tue-Sat in Europe/Rome timezone, and only once per day.
      const fmt = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Rome",
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const parts = fmt.formatToParts(now);
      const wd = parts.find((p) => p.type === "weekday")?.value ?? "";
      const todayKey = `${parts.find((p) => p.type === "year")?.value}-${parts.find((p) => p.type === "month")?.value}-${parts.find((p) => p.type === "day")?.value}`;
      if (!["Tue", "Wed", "Thu", "Fri", "Sat"].includes(wd)) return false;
      if (!lastSyncAt) return true;
      const lastParts = fmt.formatToParts(new Date(lastSyncAt));
      const lastKey = `${lastParts.find((p) => p.type === "year")?.value}-${lastParts.find((p) => p.type === "month")?.value}-${lastParts.find((p) => p.type === "day")?.value}`;
      return lastKey !== todayKey;
    }
  }
}

export const Route = createFileRoute("/api/public/hooks/market-sync")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        // Require shared secret to prevent abuse of Google Docs API quota.
        const secret = process.env.MARKET_REPORTS_WEBHOOK_SECRET;
        if (!secret) return json({ error: "Server misconfigured" }, 500);
        const auth = request.headers.get("authorization") ?? "";
        const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
        if (!provided || provided !== secret) {
          return json({ error: "Unauthorized" }, 401);
        }

        let force = false;
        try {
          const body = (await request.json().catch(() => ({}))) as { force?: boolean };
          force = Boolean(body?.force);
        } catch {
          /* ignore */
        }


        const { data, error } = await supabaseAdmin
          .from("site_settings")
          .select("market_sync_schedule, market_last_sync_at, market_doc_id")
          .eq("singleton", true)
          .maybeSingle();
        if (error) return json({ error: error.message }, 500);
        const d = (data ?? {}) as Record<string, unknown>;
        const schedule = ((d.market_sync_schedule as string) || "weekdays_7am") as Schedule;
        const lastSyncAt = (d.market_last_sync_at as string | null) ?? null;

        if (!force && !isDue(schedule, lastSyncAt)) {
          return json({ ok: true, skipped: "not_due", schedule, lastSyncAt });
        }

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
