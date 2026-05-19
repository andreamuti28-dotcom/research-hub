import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  texts: z.array(z.string().max(20000)).min(1).max(50),
  target: z.enum(["it", "en"]),
});

export const translateBatch = createServerFn({ method: "POST" })
  .inputValidator((input) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const { texts, target } = data;
    const source = target === "en" ? "Italian" : "English";
    const targetName = target === "en" ? "English" : "Italian";

    const numbered = texts
      .map((t, i) => `[[${i}]]\n${t}`)
      .join("\n\n[[END]]\n\n");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
      if (typeof item.i === "number" && item.i >= 0 && item.i < out.length) {
        out[item.i] = item.text;
      }
    }
    return { translations: out };
  });
