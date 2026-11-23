import { createFileRoute } from "@tanstack/react-router";
import { isAiConfigured } from "@/lib/ai.server";

// Temporary diagnostic for the translation pipeline. No secrets returned.
export const Route = createFileRoute("/api/public/translate-health")({
  server: {
    handlers: {
      GET: async () => {
        const out: Record<string, unknown> = { aiConfigured: isAiConfigured() };
        const t0 = Date.now();
        try {
          const { translateTexts } = await import("@/lib/translate.server");
          const r = await translateTexts(["Oggi i mercati europei hanno chiuso in forte calo."], "en");
          out.short = { ms: Date.now() - t0, r };
        } catch (e) {
          out.short = { error: String(e).slice(0, 300) };
        }
        const t1 = Date.now();
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data } = await supabaseAdmin
            .from("market_reports")
            .select("content")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          const { generateJson } = await import("@/lib/ai.server");
          const text = String(data?.content ?? "").slice(0, 20000);
          const res = await generateJson(
            'Translate to English. Return ONLY {"translations":[{"i":0,"text":"..."}]}',
            `[[0]]\n${text}`,
          );
          out.report = { ms: Date.now() - t1, len: text.length, ok: res.ok, info: res.ok ? res.text.slice(0, 200) : `${res.status} ${res.error}` };
        } catch (e) {
          out.report = { ms: Date.now() - t1, error: String(e).slice(0, 300) };
        }
        return new Response(JSON.stringify(out), {
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
