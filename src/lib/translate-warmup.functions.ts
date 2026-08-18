import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const warmupTranslations = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({
      target: z.enum(["it", "en", "es", "de", "zh", "ru", "ar"]),
    }).parse(input),
  )
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { total: 0, remaining: 0, done: true };
    const { warmupLanguage } = await import("@/lib/translate-warmup.server");
    try {
      return await warmupLanguage(data.target, apiKey);
    } catch (err) {
      console.error("Translation warmup failed:", err);
      return { total: 0, remaining: 0, done: true };
    }
  });
