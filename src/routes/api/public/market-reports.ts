import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Payload accepted from the external Google Apps Script.
// Authentication: send header `Authorization: Bearer <MARKET_REPORTS_WEBHOOK_SECRET>`
// OR `x-webhook-secret: <secret>`.
const payloadSchema = z.object({
  title: z.string().trim().min(1).max(300).default("Report mercati"),
  content: z.string().trim().min(1).max(200_000),
  reportDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  source: z.string().trim().max(200).optional(),
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-webhook-secret",
};

function unauthorized(msg = "Unauthorized") {
  return new Response(JSON.stringify({ error: msg }), {
    status: 401,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

export const Route = createFileRoute("/api/public/market-reports")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        const secret = process.env.MARKET_REPORTS_WEBHOOK_SECRET;
        if (!secret) {
          return new Response(
            JSON.stringify({ error: "Server non configurato: MARKET_REPORTS_WEBHOOK_SECRET mancante." }),
            { status: 503, headers: { "Content-Type": "application/json", ...corsHeaders } },
          );
        }
        const auth = request.headers.get("authorization") ?? "";
        const bearer = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
        const headerSecret = request.headers.get("x-webhook-secret") ?? "";
        if (bearer !== secret && headerSecret !== secret) return unauthorized();

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }
        const parsed = payloadSchema.safeParse(body);
        if (!parsed.success) {
          return new Response(
            JSON.stringify({ error: "Payload non valido", details: parsed.error.flatten() }),
            { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
          );
        }
        const data = parsed.data;
        const reportDate = data.reportDate ?? new Date().toISOString().slice(0, 10);

        // Demote any previous "current" report to archive.
        const { error: demoteErr } = await supabaseAdmin
          .from("market_reports")
          .update({ is_current: false })
          .eq("is_current", true);
        if (demoteErr) {
          return new Response(JSON.stringify({ error: demoteErr.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        const { data: inserted, error } = await supabaseAdmin
          .from("market_reports")
          .insert({
            title: data.title,
            content: data.content,
            report_date: reportDate,
            source: data.source ?? null,
            is_current: true,
          })
          .select("id, report_date, title")
          .single();

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          });
        }

        return new Response(JSON.stringify({ ok: true, report: inserted }), {
          status: 201,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      },
    },
  },
});
