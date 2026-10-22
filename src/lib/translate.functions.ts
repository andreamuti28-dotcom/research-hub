import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const LANGS = ["it", "en", "es", "de", "zh", "ru", "ar"] as const;

// Public endpoints: cap the payload so they cannot be used as a free
// general-purpose translation proxy or to flood the translation cache.
const MAX_LIVE_ITEMS = 40;
const MAX_LIVE_CHARS = 60_000;

const totalChars = (texts: string[]) => texts.reduce((n, t) => n + t.length, 0);

export const getCachedTranslationBatch = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      texts: z.array(z.string().max(50000)).min(1).max(300),
      target: z.enum(LANGS),
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
    z
      .object({
        texts: z.array(z.string().max(50000)).min(1).max(MAX_LIVE_ITEMS),
        target: z.enum(LANGS),
        force: z.boolean().optional(),
      })
      .refine((v) => totalChars(v.texts) <= MAX_LIVE_CHARS, { message: "Payload troppo grande" })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (data.target === "it" && !data.force) return { translations: data.texts };
    try {
      const { translateTexts } = await import("@/lib/translate.server");
      const result = await translateTexts(data.texts, data.target, {
        force: data.force === true,
      });
      return { translations: result.translations };
    } catch (err) {
      console.error("Live translation failed:", err);
      return { translations: data.texts };
    }
  });
