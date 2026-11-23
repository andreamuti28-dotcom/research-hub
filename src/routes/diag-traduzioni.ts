import { createFileRoute } from "@tanstack/react-router";

// Temporary diagnostic for the Gemini models. No secrets returned.
export const Route = createFileRoute("/diag-traduzioni")({
  server: {
    handlers: {
      GET: async () => {
        const { callModel } = await import("@/lib/ai.server");
        const key = process.env.GEMINI_API_KEY ?? "";
        const out: Record<string, unknown> = { key: key ? `len ${key.length}` : "missing" };
        for (const m of [
          "gemini-3.5-flash-lite",
          "gemini-3.6-flash",
          "gemini-2.5-flash",
          "gemini-2.5-flash-lite",
        ]) {
          const t = Date.now();
          const r = await callModel(
            key,
            m,
            'Translate to English. Return {"t":"..."}',
            "Buongiorno a tutti",
          );
          out[m] = {
            ms: Date.now() - t,
            ok: r.ok,
            info: r.ok ? r.text.slice(0, 80) : `${r.status} ${r.error.slice(0, 220)}`,
          };
        }
        return new Response(JSON.stringify(out), {
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        });
      },
    },
  },
});
