import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  reportId: z.string().uuid(),
});

// Formatted layouts live in the translation cache under their own target, keyed
// by the hash of the raw report text: each report is formatted once, ever,
// instead of once per visitor.
const LAYOUT_CACHE_TARGET = "it-layout";

const SYSTEM_PROMPT =
  "You receive an Italian financial report stored as plain text from Google Docs. " +
  "Reformat it into clean Markdown: detect section titles and turn them into '## ' or '### ' headings, " +
  "convert bullet-like lines into '- ' lists, group paragraphs with blank lines, mark obvious emphasis with **bold** or *italic*, " +
  "and preserve any tables. " +
  "STRICT RULES: do NOT translate, do NOT add, remove, summarize or rewrite any word; keep the Italian wording exactly as-is, " +
  "including punctuation, numbers, currencies and proper nouns. Only add/normalize markdown structure (headings, lists, blank lines, bold/italic). " +
  'Return ONLY a JSON object: {"text":"..."} with the reformatted markdown.';

/**
 * Re-format the Italian market report into the same markdown layout the EN
 * translator produces (headings, bold, bullet lists, paragraphs, tables). The
 * wording MUST stay exactly the same: only structural markdown is added.
 *
 * Public endpoint: it only accepts the id of a stored report, never arbitrary
 * text, so it cannot be used to spend the AI quota on someone else's content.
 */
export const formatMarketReportLayout = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: report } = await supabaseAdmin
      .from("market_reports")
      .select("content")
      .eq("id", data.reportId)
      .maybeSingle();
    const raw = (report?.content as string | undefined) ?? "";
    if (!raw.trim()) return { text: raw, fallback: true as const };

    const { readCachedTranslations, writeCachedTranslations } = await import(
      "@/lib/translation-cache.server"
    );
    const cached = await readCachedTranslations([raw], LAYOUT_CACHE_TARGET);
    const hit = cached.get(raw);
    if (hit) return { text: hit, fallback: false as const };

    try {
      const { generateJson, isAiConfigured } = await import("@/lib/ai.server");
      if (!isAiConfigured()) return { text: raw, fallback: true as const };

      const res = await generateJson(SYSTEM_PROMPT, raw);
      if (!res.ok) {
        console.error(`[format-layout] HTTP ${res.status} ${res.error}`);
        return { text: raw, fallback: true as const };
      }
      let parsed: { text?: string } = {};
      try {
        parsed = JSON.parse(res.text);
      } catch {
        parsed = {};
      }
      const formatted = typeof parsed.text === "string" && parsed.text.trim() ? parsed.text : "";
      if (!formatted) return { text: raw, fallback: true as const };

      await writeCachedTranslations([{ source: raw, translated: formatted }], LAYOUT_CACHE_TARGET);
      return { text: formatted, fallback: false as const };
    } catch (e) {
      console.error("[format-layout] error", e);
      return { text: raw, fallback: true as const };
    }
  });
