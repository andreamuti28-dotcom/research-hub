// Server-only helper for the AI features (translation retries and report
// layout). Talks to the Google Gemini API directly, so it only needs a
// GEMINI_API_KEY secret on the Worker. Every caller degrades gracefully when
// the key is missing or the provider is unavailable.

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-3.5-flash-lite";
// Tried in order when the preferred model is overloaded (503) or rate-limited.
const FALLBACK_MODELS = ["gemini-3.6-flash", "gemini-2.5-flash"];
const RETRYABLE = new Set([429, 500, 503, 504]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export type AiJsonResult =
  | { ok: true; text: string }
  | { ok: false; status: number; error: string };

/**
 * Run a single prompt and ask the model to answer with a JSON document.
 * Returns the raw JSON text; callers parse it and fall back on failure.
 */
export async function generateJson(system: string, user: string): Promise<AiJsonResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, status: 0, error: "GEMINI_API_KEY non configurata" };
  const models = [process.env.AI_MODEL || DEFAULT_MODEL, ...FALLBACK_MODELS].filter(
    (m, i, all) => all.indexOf(m) === i,
  );
  let last: AiJsonResult = { ok: false, status: 0, error: "Nessun modello disponibile" };
  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      last = await callModel(apiKey, model, system, user);
      if (last.ok || !RETRYABLE.has(last.status)) return last;
      await sleep(700 * (attempt + 1));
    }
  }
  return last;
}

export async function callModel(
  apiKey: string,
  model: string,
  system: string,
  user: string,
): Promise<AiJsonResult> {
  let res: Response;
  try {
    res = await fetch(`${GEMINI_BASE}/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
      }),
    });
  } catch (err) {
    return { ok: false, status: 503, error: err instanceof Error ? err.message : String(err) };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return { ok: false, status: res.status, error: body.slice(0, 300) };
  }

  const json = (await res.json().catch(() => null)) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  } | null;
  const text = (json?.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) return { ok: false, status: 503, error: "Risposta vuota dal modello" };
  return { ok: true, text };
}
