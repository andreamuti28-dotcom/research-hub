import { unescapeMarkdown } from "@/lib/markdown-escape";
import { LAYOUT_CACHE_TARGET, SYSTEM_PROMPT } from "@/lib/format-layout.shared";

/**
 * Turn the stored Italian report into the markdown the home page shows (and
 * translates). Shared by the public endpoint and the morning pre-translation,
 * so both work on exactly the same text.
 */
export async function formatReportText(
  content: string,
): Promise<{ text: string; fallback: boolean }> {
  const raw = unescapeMarkdown(content);
  if (!raw.trim()) return { text: raw, fallback: true };
  // Already written as Markdown (headings): show it exactly as written.
  if (/^#{1,3}\s/m.test(raw)) return { text: raw, fallback: false };

  const { readCachedTranslations, writeCachedTranslations } =
    await import("@/lib/translation-cache.server");
  const cached = await readCachedTranslations([raw], LAYOUT_CACHE_TARGET);
  const hit = cached.get(raw);
  if (hit) return { text: hit, fallback: false };

  try {
    const { generateJson, isAiConfigured } = await import("@/lib/ai.server");
    if (!isAiConfigured()) return { text: raw, fallback: true };

    const res = await generateJson(SYSTEM_PROMPT, raw);
    if (!res.ok) {
      console.error(`[format-layout] HTTP ${res.status} ${res.error}`);
      return { text: raw, fallback: true };
    }
    let parsed: { text?: string } = {};
    try {
      parsed = JSON.parse(res.text);
    } catch {
      parsed = {};
    }
    const formatted = typeof parsed.text === "string" && parsed.text.trim() ? parsed.text : "";
    if (!formatted) return { text: raw, fallback: true };

    await writeCachedTranslations([{ source: raw, translated: formatted }], LAYOUT_CACHE_TARGET);
    return { text: formatted, fallback: false };
  } catch (e) {
    console.error("[format-layout] error", e);
    return { text: raw, fallback: true };
  }
}
