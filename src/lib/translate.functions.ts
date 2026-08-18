import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Lang } from "@/hooks/use-language";

const MAX_TRANSLATION_TEXTS = 300;
const MAX_TEXT_CHARS = 50000;
const SERVER_CHUNK_SIZE = 30;
const FALLBACK_CHUNK_CHARS = 3500;

const TARGET_NAMES: Record<Lang, string> = {
  it: "Italian",
  en: "English",
  es: "Spanish",
  de: "German",
  zh: "Chinese (Simplified)",
  ru: "Russian",
  ar: "Arabic",
};

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

async function translateWithFallback(
  texts: string[],
  target: "it" | "en",
): Promise<TranslateResult> {
  const translations = await Promise.all(
    texts.map(async (text) => {
      if (!text.trim()) return text;
      const chunks = splitForFallback(text);
      const translatedChunks = await Promise.all(
        chunks.map(async (chunk) => {
          const params = new URLSearchParams({
            client: "gtx",
            sl: "auto",
            tl: target,
            dt: "t",
            q: chunk,
          });
          const res = await fetch(
            `https://translate.googleapis.com/translate_a/single?${params.toString()}`,
            { headers: { Accept: "application/json" } },
          );
          if (!res.ok) throw new Error(`Fallback translation failed: ${res.status}`);
          const json = (await res.json()) as unknown;
          if (!Array.isArray(json) || !Array.isArray(json[0])) return chunk;
          return json[0]
            .map((part) => (Array.isArray(part) && typeof part[0] === "string" ? part[0] : ""))
            .join("");
        }),
      );
      return translatedChunks.join("");
    }),
  );
  return { translations, fallback: false };
}

const InputSchema = z.object({
  texts: z.array(z.string().max(MAX_TEXT_CHARS)).min(1).max(MAX_TRANSLATION_TEXTS),
  target: z.enum(["it", "en"]),
});

async function translateWithAi(
  texts: string[],
  target: "it" | "en",
  apiKey: string,
): Promise<TranslateResult> {
  const targetName = target === "en" ? "English" : "Italian";

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
  target: "it" | "en",
  apiKey: string,
): Promise<TranslateResult> {
  try {
    return await translateWithFallback(texts, target);
  } catch (err) {
    console.warn("Primary translation fallback failed, trying AI:", err);
    return translateWithAi(texts, target, apiKey);
  }
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
    const results = await Promise.all(
      chunks.map((c) =>
        translateChunk(c, target, apiKey).catch((err) => {
          console.error("Translation chunk failed:", err);
          return { translations: c, fallback: true } satisfies TranslateResult;
        }),
      ),
    );
    return {
      translations: results.flatMap((r) => r.translations),
      fallback: results.some((r) => r.fallback),
    };
  });
