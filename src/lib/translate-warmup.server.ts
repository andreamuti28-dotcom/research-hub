import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { parseContent } from "@/lib/paper-reading";
import { translateTexts } from "@/lib/translate.server";
import { readCachedTranslations } from "@/lib/translation-cache.server";
import type { Lang } from "@/hooks/use-language";

const BATCH = 40;

/**
 * Collect every Italian source string the public site can display, so a single
 * warm-up pass fills the translation cache for the whole site instead of each
 * page paying for its own translation on first visit.
 */
export async function collectSiteTexts(): Promise<string[]> {
  const texts: string[] = [];

  const [{ data: papers }, { data: dashboards }, { data: settings }] = await Promise.all([
    supabaseAdmin.from("papers").select("title, abstract, content, is_published, publish_at"),
    supabaseAdmin.from("dashboards").select("title, description").eq("is_published", true),
    supabaseAdmin.from("site_settings").select("*").limit(1).maybeSingle(),
  ]);

  const now = Date.now();
  for (const p of papers ?? []) {
    const visible =
      p.is_published || (p.publish_at ? new Date(p.publish_at).getTime() <= now : false);
    if (!visible) continue;
    texts.push(p.title ?? "", p.abstract ?? "");
    if (p.content) {
      const { blocks } = parseContent(p.content);
      for (const b of blocks) texts.push(b.text);
    }
  }

  for (const d of dashboards ?? []) {
    texts.push(d.title ?? "", d.description ?? "");
  }

  if (settings) {
    for (const [key, value] of Object.entries(settings as Record<string, unknown>)) {
      if (key.endsWith("_url") || key.endsWith("_urls")) continue;
      if (typeof value === "string") {
        texts.push(value);
      } else if (value && typeof value === "object") {
        collectStrings(value, texts);
      }
    }
  }

  return Array.from(
    new Set(
      texts
        .map((t) => (typeof t === "string" ? t.trim() : ""))
        .filter((t) => t.length > 1 && /[a-zA-ZÀ-ÿ]/.test(t) && !/^https?:\/\//.test(t)),
    ),
  );
}

function collectStrings(value: unknown, out: string[], depth = 0) {
  if (depth > 4) return;
  if (typeof value === "string") {
    out.push(value);
  } else if (Array.isArray(value)) {
    for (const v of value) collectStrings(v, out, depth + 1);
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (k.toLowerCase().includes("url") || k === "icon") continue;
      collectStrings(v, out, depth + 1);
    }
  }
}

/** Max texts handled per warmup call, so a single request stays short-lived. */
const SLICE = 160;
/** Batches translated in parallel inside one call. */
const CONCURRENCY = 4;

/**
 * Translate everything into `target`, filling the persistent cache.
 * Already-cached texts are skipped, and the remaining work is capped per call
 * so the client can resume instead of holding one long, abortable request.
 */
export async function warmupLanguage(target: Lang, apiKey: string) {
  if (target === "it") return { total: 0, remaining: 0, done: true };

  const texts = await collectSiteTexts();
  const cached = await readCachedTranslations(texts, target);
  const pending = texts.filter((t) => !cached.has(t));
  const slice = pending.slice(0, SLICE);

  const batches: string[][] = [];
  for (let i = 0; i < slice.length; i += BATCH) batches.push(slice.slice(i, i + BATCH));

  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, batches.length) }, async () => {
      while (cursor < batches.length) {
        const batch = batches[cursor++];
        try {
          await translateTexts(batch, target, apiKey);
        } catch (err) {
          console.error("Warmup batch failed:", err);
        }
      }
    }),
  );

  const remaining = Math.max(pending.length - slice.length, 0);
  return { total: texts.length, remaining, done: remaining === 0 };
}
