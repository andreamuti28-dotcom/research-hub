import type { Lang } from "@/hooks/use-language";
import { readCachedTranslations, writeCachedTranslations } from "@/lib/translation-cache.server";
import { generateJson, isAiConfigured } from "@/lib/ai.server";

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

// Google's free endpoint answers 429 ("Sorry...") to Cloudflare's datacenter
// IPs. After a refusal, skip it for a while instead of retrying every chunk.
let googleBlockedUntil = 0;

async function googleTranslateChunk(chunk: string, target: Lang): Promise<string> {
  if (Date.now() < googleBlockedUntil) throw new Error("Fallback translation temporarily blocked");
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
  if (!res.ok) {
    if (res.status === 429 || res.status === 403) googleBlockedUntil = Date.now() + 10 * 60_000;
    throw new Error(`Fallback translation failed: ${res.status}`);
  }
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

async function translateWithFallback(texts: string[], target: Lang): Promise<TranslateResult> {
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

async function translateWithAi(texts: string[], target: Lang): Promise<TranslateResult> {
  // Without an AI key the free translation endpoint is the only engine:
  // keep whatever it produced instead of failing the request.
  if (!isAiConfigured()) return { translations: texts, fallback: true };

  const targetName = TARGET_NAMES[target];
  const numbered = texts.map((t, i) => `[[${i}]]\n${t}`).join("\n\n[[END]]\n\n");

  const res = await generateJson(
    `You are a professional translator. Detect the source language of each input automatically and translate it to ${targetName}. Preserve markdown, LaTeX math ($...$ and $$...$$), line breaks, and tone. If a text is already entirely in ${targetName}, keep it as-is. Always output natural, fluent ${targetName}. Return ONLY a JSON object: {"translations":[{"i":0,"text":"..."}, ...]} with one entry per input in order.`,
    numbered,
  );

  if (!res.ok) {
    // Graceful degradation: on quota/rate-limit failures, return originals
    // so the UI stays usable instead of crashing the route.
    if (res.status === 402 || res.status === 429 || res.status === 0) {
      console.warn(`AI translation skipped (${res.status}): ${res.error}`);
      return { translations: texts, fallback: true };
    }
    throw new Error(`Translation failed: ${res.status} ${res.error}`);
  }
  let parsed: { translations?: Array<{ i: number; text: string }> } = {};
  const content = res.text;
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

async function translateChunk(texts: string[], target: Lang): Promise<TranslateResult> {
  // With a Gemini key the AI is the primary engine: it keeps markdown and
  // LaTeX intact and, unlike Google's free endpoint, works from the Worker.
  if (isAiConfigured()) return translateChunkAiFirst(texts, target);
  return translateChunkGoogleFirst(texts, target);
}

const AI_PIECE_CHARS = 2500;
const AI_BATCH_CHARS = 9000;
const AI_BATCH_ITEMS = 15;

/** Split a long text on paragraph breaks into pieces of manageable size. */
function splitForAi(text: string): string[] {
  if (text.length <= AI_PIECE_CHARS) return [text];
  const paragraphs = text.split(/\n\n+/);
  const pieces: string[] = [];
  let current = "";
  for (const para of paragraphs) {
    if (current && current.length + para.length + 2 > AI_PIECE_CHARS) {
      pieces.push(current);
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

async function translateChunkAiFirst(texts: string[], target: Lang): Promise<TranslateResult> {
  const out = [...texts];
  let degraded = false;

  // Long texts (the daily report, whole paper sections) are split into
  // paragraphs and sent in small batches: one huge JSON answer is slow and
  // easily comes back truncated or malformed.
  const pieces: string[] = [];
  const spans: Array<{ start: number; count: number }> = [];
  for (const text of texts) {
    const parts = text.trim() ? splitForAi(text) : [];
    spans.push({ start: pieces.length, count: parts.length });
    pieces.push(...parts);
  }
  const batches: number[][] = [];
  let batch: number[] = [];
  let chars = 0;
  pieces.forEach((piece, idx) => {
    if (batch.length && (chars + piece.length > AI_BATCH_CHARS || batch.length >= AI_BATCH_ITEMS)) {
      batches.push(batch);
      batch = [];
      chars = 0;
    }
    batch.push(idx);
    chars += piece.length;
  });
  if (batch.length) batches.push(batch);

  const translatedPieces: Array<string | null> = pieces.map(() => null);
  await mapLimit(batches, 3, async (indexes) => {
    try {
      const ai = await translateWithAi(
        indexes.map((k) => pieces[k]),
        target,
      );
      if (ai.fallback) degraded = true;
      indexes.forEach((k, j) => {
        const candidate = ai.translations[j];
        const src = pieces[k];
        const unchanged =
          typeof candidate !== "string" ||
          !candidate.trim() ||
          (candidate.trim() === src.trim() && src.trim().split(/\s+/).length >= 4) ||
          looksUntranslated(candidate, target);
        translatedPieces[k] = unchanged ? null : candidate;
      });
    } catch (err) {
      console.error("AI translation batch failed:", err);
      degraded = true;
    }
  });

  spans.forEach(({ start, count }, i) => {
    if (count === 0) return;
    const parts = translatedPieces.slice(start, start + count);
    // Only accept a text when every piece came back translated, so the cache
    // never stores a half-Italian version.
    if (parts.every((p): p is string => typeof p === "string")) out[i] = parts.join("\n\n");
  });

  const retry = out
    .map((text, i) =>
      text.trim() && (text === texts[i] || looksUntranslated(text, target)) ? i : -1,
    )
    .filter((i) => i >= 0);
  await mapLimit(retry, 3, async (i) => {
    try {
      const res = await translateWithFallback([texts[i]], target);
      out[i] = res.translations[0] ?? out[i];
    } catch {
      // Keep the original: translateTexts will not cache it, so it is retried later.
    }
  });
  return degraded ? { translations: out, fallback: true } : { translations: out };
}

async function translateChunkGoogleFirst(texts: string[], target: Lang): Promise<TranslateResult> {
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

  // Final guard: anything still in the source script — or returned verbatim by
  // the provider (Google sometimes misdetects the source and echoes it back) —
  // goes through the AI, so a single stubborn abstract can't stay untranslated.
  const stillUntranslated = out
    .map((text, i) => {
      if (!text.trim()) return -1;
      if (looksUntranslated(text, target)) return i;
      const src = texts[i] ?? "";
      const echoed = text.trim() === src.trim() && src.trim().split(/\s+/).length >= 4;
      return echoed ? i : -1;
    })
    .filter((i) => i >= 0);
  if (stillUntranslated.length > 0) {
    await aiRetry(stillUntranslated);
  }

  return degraded ? { translations: out, fallback: true } : { translations: out };
}

/**
 * Translate a list of texts, reusing anything already stored in the
 * persistent translation cache. Only genuinely new strings hit the
 * translation providers, which makes repeat visits effectively instant.
 */
export async function translateTexts(
  texts: string[],
  target: Lang,
  opts: { force?: boolean } = {},
): Promise<TranslateResult> {
  if (target === "it" && !opts.force) return { translations: texts };

  const nonEmpty = texts.filter((t) => t.trim().length > 0);
  const unique = Array.from(new Set(nonEmpty));
  const cached = await readCachedTranslations(unique, target);
  const missing = unique.filter((t) => !cached.has(t));

  let fallback = false;
  if (missing.length > 0) {
    const chunks: string[][] = [];
    for (let i = 0; i < missing.length; i += SERVER_CHUNK_SIZE) {
      chunks.push(missing.slice(i, i + SERVER_CHUNK_SIZE));
    }
    const results = await mapLimit(chunks, 2, (c) =>
      translateChunk(c, target).catch((err) => {
        console.error("Translation chunk failed:", err);
        return { translations: c, fallback: true } satisfies TranslateResult;
      }),
    );
    const translated = results.flatMap((r) => r.translations);
    fallback = results.some((r) => r.fallback);

    const fresh: Array<{ source: string; translated: string }> = [];
    missing.forEach((source, i) => {
      const value = translated[i];
      if (typeof value !== "string" || !value.trim()) return;
      cached.set(source, value);
      // Never cache a text that came back untranslated: it must be retried later.
      if (value !== source && !looksUntranslated(value, target)) {
        fresh.push({ source, translated: value });
      }
    });
    await writeCachedTranslations(fresh, target);
  }

  return {
    translations: texts.map((t) => (t.trim() ? (cached.get(t) ?? t) : t)),
    fallback,
  };
}
