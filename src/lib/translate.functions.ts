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