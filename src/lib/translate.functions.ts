import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Lang } from "@/hooks/use-language";

const MAX_TRANSLATION_TEXTS = 300;
const MAX_TEXT_CHARS = 50000;
const SERVER_CHUNK_SIZE = 30;
const FALLBACK_CHUNK_CHARS = 1200;

const TARGET_NAMES: Record<Lang, string> = {
  it: "Italian",
  en: "English",
  es: "Spanish",
  de: "German",
  zh: "Chinese (Simplified)",
  ru: "Russian",
  ar: "Arabic",
};

// Google's endpoint expects locale-style codes for some languages.
const GOOGLE_TL: Record<Lang, string> = {
  it: "it",
  en: "en",
  es: "es",
  de: "de",
  zh: "zh-CN",
  ru: "ru",
  ar: "ar",
};

// Scripts we can verify: if the "translation" contains none of the target
// script, the call silently returned the source text and must be retried.
const TARGET_SCRIPT: Partial<Record<Lang, RegExp>> = {
  zh: /[\u4e00-\u9fff]/,
  ru: /[\u0400-\u04ff]/,
  ar: /[\u0600-\u06ff]/,
};

function looksUntranslated(text: string, target: Lang): boolean {
  const re = TARGET_SCRIPT[target];
  if (!re) return false;
  if (!/[A-Za-z\u00c0-\u024f]/.test(text)) return false;
  return !re.test(text);
}

type TranslateResult = {
  translations: string[];
  fallback?: boolean;
};

function splitForFallback(text: string): string[] {
  if (text.length <= FALLBACK_CHUNK_CHARS) return [text];
  const pieces = text.split(/(\n\n+)/);
  const chunks: string[] = [];
  let current = "";
  for (const piece of pieces) {
    if (current && current.length + piece.length > FALLBACK_CHUNK_CHARS) {
      chunks.push(current);
      current = "";
    }
    if (piece.length > FALLBACK_CHUNK_CHARS) {
      for (let i = 0; i < piece.length; i += FALLBACK_CHUNK_CHARS) {
        chunks.push(piece.slice(i, i + FALLBACK_CHUNK_CHARS));
      }
    } else {
      current += piece;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/** Run async work with bounded concurrency so we don't trip Google's rate limits. */
async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const out = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return out;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function googleTranslateChunk(chunk: string, target: Lang): Promise<string> {
  const params = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl: GOOGLE_TL[target],
    dt: "t",
    q: chunk,
  });
  const res = await fetch(
    `https://translate.googleapis.com/translate_a/single?${params.toString()}`,
    { headers: { Accept: "application/json" } },
  );
  if (!res.ok) throw new Error(`Fallback translation failed: ${res.status}`);
  const json = (await res.json()) as unknown;
  if (!Array.isArray(json) || !Array.isArray(json[0])) {
    throw new Error("Fallback translation returned an unexpected payload");
  }
  const joined = json[0]
    .map((part) => (Array.isArray(part) && typeof part[0] === "string" ? part[0] : ""))
    .join("");
  if (!joined.trim()) throw new Error("Fallback translation returned empty text");
  if (looksUntranslated(joined, target)) {
    throw new Error("Fallback translation returned untranslated text");
  }
  return joined;
}

async function translateWithFallback(
  texts: string[],
  target: Lang,
): Promise<TranslateResult> {
  const translations = await mapLimit(texts, 3, async (text) => {
    if (!text.trim()) return text;
    const chunks = splitForFallback(text);
    const translatedChunks = await mapLimit(chunks, 3, async (chunk) => {
      let lastErr: unknown;
      // Transient 429/503 from the public endpoint is common when several
      // cards translate at once: retry with a short backoff before giving up.
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return await googleTranslateChunk(chunk, target);
        } catch (err) {
          lastErr = err;
          await sleep(250 * (attempt + 1));
        }
      }
      throw lastErr;
    });
    return translatedChunks.join("");
  });
  return { translations, fallback: false };
}


const InputSchema = z.object({
  texts: z.array(z.string().max(MAX_TEXT_CHARS)).min(1).max(MAX_TRANSLATION_TEXTS),
  target: z.enum(["it", "en", "es", "de", "zh", "ru", "ar"]),
});

async function translateWithAi(
  texts: string[],
  target: Lang,
  apiKey: string,
): Promise<TranslateResult> {
  const targetName = TARGET_NAMES[target];

  const numbered = texts.map((t, i) => `[[${i}]]\n${t}`).join("\n\n[[END]]\n\n");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Detect the source language of each input automatically and translate it to ${targetName}. Preserve markdown, LaTeX math ($...$ and $$...$$), line breaks, and tone. If a text is already entirely in ${targetName}, keep it as-is. Always output natural, fluent ${targetName}. Return ONLY a JSON object: {"translations":[{"i":0,"text":"..."}, ...]} with one entry per input in order.`,
        },
        {
          role: "user",
          content: numbered,
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    // Graceful degradation: on credit/rate-limit failures, return originals
    // so the UI stays usable instead of crashing the route.
    if (res.status === 402 || res.status === 429) {
      console.warn(`Translation skipped (${res.status}): ${txt.slice(0, 200)}`);
      return translateWithFallback(texts, target).catch((err) => {
        console.error("Fallback translation failed:", err);
        return { translations: texts, fallback: true };
      });
    }
    throw new Error(`Translation failed: ${res.status} ${txt.slice(0, 200)}`);
  }
  const json = (await res.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  const content = json.choices?.[0]?.message?.content ?? "{}";
  let parsed: { translations?: Array<{ i: number; text: string }> } = {};
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }
  const out = [...texts];
  for (const item of parsed.translations ?? []) {
    if (
      typeof item.i === "number" &&
      item.i >= 0 &&
      item.i < out.length &&
      typeof item.text === "string"
    ) {
      const cleaned = item.text
        .replace(/\s*\[\[END\]\]\s*/g, "")
        .replace(/^\s*-{3,}\s*|\s*-{3,}\s*$/g, "")
        .trim();
      out[item.i] = cleaned;
    }
  }
  return { translations: out };
}

async function translateChunk(
  texts: string[],
  target: Lang,
  apiKey: string,
): Promise<TranslateResult> {
  const out = [...texts];
  const failed: number[] = [];

  await mapLimit(texts, 4, async (text, i) => {
    if (!text.trim()) return;
    try {
      const res = await translateWithFallback([text], target);
      out[i] = res.translations[0] ?? text;
    } catch (err) {
      console.warn("Primary translation failed for one item, will retry with AI:", err);
      failed.push(i);
    }
  });

  let degraded = false;

  const aiRetry = async (indexes: number[]) => {
    if (indexes.length === 0) return;
    try {
      const ai = await translateWithAi(
        indexes.map((i) => texts[i]),
        target,
        apiKey,
      );
      indexes.forEach((idx, k) => {
        const candidate = ai.translations[k];
        if (typeof candidate === "string" && candidate.trim()) out[idx] = candidate;
      });
      if (ai.fallback) degraded = true;
    } catch (err) {
      console.error("AI translation retry failed:", err);
      degraded = true;
    }
  };

  await aiRetry(failed);

  // Final guard: anything still in the source script goes back through the AI
  // one item at a time, so a single stubborn abstract can't stay untranslated.
  const stillUntranslated = out
    .map((text, i) => (text.trim() && looksUntranslated(text, target) ? i : -1))
    .filter((i) => i >= 0);
  for (const idx of stillUntranslated) {
    await aiRetry([idx]);
  }

  return degraded ? { translations: out, fallback: true } : { translations: out };
}


export const translateBatch = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const { texts, target } = data;
    const chunks: string[][] = [];
    for (let i = 0; i < texts.length; i += SERVER_CHUNK_SIZE) {
      chunks.push(texts.slice(i, i + SERVER_CHUNK_SIZE));
    }
    const results = await mapLimit(chunks, 2, (c) =>
      translateChunk(c, target, apiKey).catch((err) => {
        console.error("Translation chunk failed:", err);
        return { translations: c, fallback: true } satisfies TranslateResult;
      }),
    );

    return {
      translations: results.flatMap((r) => r.translations),
      fallback: results.some((r) => r.fallback),
    };
  });
