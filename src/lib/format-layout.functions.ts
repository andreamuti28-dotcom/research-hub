import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  text: z.string().min(1).max(100_000),
});

/**
 * Re-format an Italian text into the same markdown layout the EN translator
 * produces (headings, bold, bullet lists, paragraphs, tables). The wording
 * MUST stay exactly the same — only structural markdown is added/normalized.
 */
export const formatMarketReportLayout = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const apiKey = process.env.LOVABLE_API_KEY;
      if (!apiKey) return { text: data.text, fallback: true as const };

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
              content:
                "You receive an Italian financial report stored as plain text from Google Docs. " +
                "Reformat it into clean Markdown: detect section titles and turn them into '## ' or '### ' headings, " +
                "convert bullet-like lines into '- ' lists, group paragraphs with blank lines, mark obvious emphasis with **bold** or *italic*, " +
                "and preserve any tables. " +
                "STRICT RULES: do NOT translate, do NOT add, remove, summarize or rewrite any word; keep the Italian wording exactly as-is, " +
                "including punctuation, numbers, currencies and proper nouns. Only add/normalize markdown structure (headings, lists, blank lines, bold/italic). " +
                'Return ONLY a JSON object: {"text":"..."} with the reformatted markdown.',
            },
            { role: "user", content: data.text },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        const txt = await res.text();
        console.error(`[format-layout] HTTP ${res.status} ${txt.slice(0, 200)}`);
        return { text: data.text, fallback: true as const };
      }
      const json = (await res.json()) as {
        choices: Array<{ message: { content: string } }>;
      };
      const content = json.choices?.[0]?.message?.content ?? "{}";
      let parsed: { text?: string } = {};
      try {
        parsed = JSON.parse(content);
      } catch {
        parsed = {};
      }
      return {
        text: typeof parsed.text === "string" && parsed.text.trim() ? parsed.text : data.text,
        fallback: false as const,
      };
    } catch (e) {
      console.error("[format-layout] error", e);
      return { text: data.text, fallback: true as const };
    }
  });
