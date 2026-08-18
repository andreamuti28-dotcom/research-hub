import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getCachedTranslationBatch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      texts: z.array(z.string().max(50000)).min(1).max(300),
      target: z.enum(["it", "en", "es", "de", "zh", "ru", "ar"]),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    if (data.target === "it") {
      return { translations: data.texts, missing: false };
    }

    const { readCachedTranslations } = await import("@/lib/translation-cache.server");
    const cached = await readCachedTranslations(data.texts, data.target);
    return {
      translations: data.texts.map((text) => (text.trim() ? (cached.get(text) ?? text) : text)),
      missing: data.texts.some((text) => text.trim() && !cached.has(text)),
    };
  });
/**
 * Live translation for dynamic content (market report, news feed) that is not
 * covered by the warmup cache: reads cache first, then translates on demand.
 */
export const translateLiveBatch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      texts: z.array(z.string().max(50000)).min(1).max(120),
      target: z.enum(["it", "en", "es", "de", "zh", "ru", "ar"]),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    if (data.target === "it") return { translations: data.texts };
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { translations: data.texts };
    try {
      const { translateTexts } = await import("@/lib/translate.server");
      const result = await translateTexts(data.texts, data.target, apiKey);
      return { translations: result.translations };
    } catch (err) {
      console.error("Live translation failed:", err);
      return { translations: data.texts };
    }
  });
