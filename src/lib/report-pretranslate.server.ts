import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { formatReportText } from "@/lib/format-layout.server";
import { readCachedTranslations } from "@/lib/translation-cache.server";
import { translateTexts } from "@/lib/translate.server";
import type { Lang } from "@/hooks/use-language";

const TARGETS: Lang[] = ["en", "de", "es", "fr", "zh", "ru", "ar", "hi"];

/**
 * Translate the current market report into every site language and store it
 * in the cache, so no visitor ever sees it in Italian. It works on exactly the
 * text the home page translates, and skips languages already done, so it can
 * run several times a morning at no cost.
 */
export async function pretranslateCurrentReport(): Promise<Record<string, string>> {
  const { data } = await supabaseAdmin
    .from("market_reports")
    .select("content")
    .order("is_current", { ascending: false })
    .order("report_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const content = (data?.content as string | undefined) ?? "";
  if (!content.trim()) return { report: "missing" };

  const { text } = await formatReportText(content);
  const status: Record<string, string> = {};
  for (const lang of TARGETS) {
    const cached = await readCachedTranslations([text], lang);
    if (cached.has(text)) {
      status[lang] = "cached";
      continue;
    }
    // One language at a time keeps well inside the per-minute quota.
    const res = await translateTexts([text], lang);
    status[lang] = res.translations[0] !== text ? "translated" : "failed";
  }
  return status;
}
