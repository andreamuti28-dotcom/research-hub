import { createFileRoute } from "@tanstack/react-router";
import { generateJson, isAiConfigured } from "@/lib/ai.server";

// Temporary diagnostic: checks whether each translation provider answers from
// the Worker. Returns only status codes and short error snippets, no secrets.
export const Route = createFileRoute("/api/public/translate-health")({
  server: {
    handlers: {
      GET: async () => {
        const out: Record<string, unknown> = {
          aiConfigured: isAiConfigured(),
          model: process.env.AI_MODEL || "default",
        };
        try {
          const params = new URLSearchParams({
            client: "gtx",
            sl: "auto",
            tl: "en",
            dt: "t",
            q: "Buongiorno a tutti",
          });
          const res = await fetch(`https://translate.googleapis.com/translate_a/single?${params}`);
          out.google = { status: res.status, body: (await res.text()).slice(0, 160) };
        } catch (e) {
          out.google = { error: String(e).slice(0, 200) };
        }
        const ai = await generateJson(
          'Translate to English. Return {"t":"..."}',
          "Buongiorno a tutti",
        );
        out.gemini = ai.ok
          ? { ok: true, text: ai.text.slice(0, 120) }
          : {
              ok: false,
              status: ai.status,
              error: ai.error.replace(/AIza[\w-]+/g, "***").slice(0, 300),
            };
        return new Response(JSON.stringify(out), {
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
