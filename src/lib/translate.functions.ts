import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MAX_TRANSLATION_TEXTS = 60;
const MAX_TEXT_CHARS = 4000;
const SERVER_CHUNK_SIZE = 30;

const InputSchema = z.object({
  texts: z.array(z.string().max(MAX_TEXT_CHARS)).min(1).max(MAX_TRANSLATION_TEXTS),
  target: z.enum(["it", "en"]),
});


async function translateChunk(texts: string[], target: "it" | "en", apiKey: string) {
  const source = target === "en" ? "Italian" : "English";
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
          content: `You are a professional translator. Translate from ${source} to ${targetName}. Preserve markdown, LaTeX math ($...$ and $$...$$), line breaks, and tone. If a text is already in ${targetName}, keep it as-is. Return ONLY a JSON object: {"translations":[{"i":0,"text":"..."}, ...]} with one entry per input in order.`,
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
    if (typeof item.i === "number" && item.i >= 0 && item.i < out.length && typeof item.text === "string") {
      const cleaned = item.text
        .replace(/\s*\[\[END\]\]\s*/g, "")
        .replace(/^\s*-{3,}\s*|\s*-{3,}\s*$/g, "")
        .trim();
      out[item.i] = cleaned;
    }
  }
  return out;
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
    const results = await Promise.all(chunks.map((c) => translateChunk(c, target, apiKey)));
    return { translations: results.flat() };
  });
