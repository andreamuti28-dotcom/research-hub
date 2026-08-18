import { supabaseAdmin } from "@/integrations/supabase/client.server";

const LOOKUP_CHUNK = 150;

export async function hashText(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

/** Map of source text -> already-translated text for the given target. */
export async function readCachedTranslations(
  texts: string[],
  target: string,
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (texts.length === 0) return out;
  try {
    const hashes = await Promise.all(texts.map(hashText));
    const byHash = new Map(hashes.map((h, i) => [h, texts[i]] as const));
    for (let i = 0; i < hashes.length; i += LOOKUP_CHUNK) {
      const slice = hashes.slice(i, i + LOOKUP_CHUNK);
      const { data, error } = await supabaseAdmin
        .from("translation_cache")
        .select("hash, translated")
        .eq("target", target)
        .in("hash", slice);
      if (error) throw new Error(error.message);
      for (const row of data ?? []) {
        const source = byHash.get(row.hash as string);
        if (source) out.set(source, row.translated as string);
      }
    }
  } catch (err) {
    console.error("Translation cache read failed:", err);
  }
  return out;
}

export async function writeCachedTranslations(
  entries: Array<{ source: string; translated: string }>,
  target: string,
): Promise<void> {
  if (entries.length === 0) return;
  try {
    const rows = await Promise.all(
      entries.map(async (e) => ({
        hash: await hashText(e.source),
        target,
        translated: e.translated,
      })),
    );
    // Dedupe by hash so a single upsert never conflicts with itself.
    const unique = Array.from(new Map(rows.map((r) => [r.hash, r])).values());
    for (let i = 0; i < unique.length; i += LOOKUP_CHUNK) {
      const { error } = await supabaseAdmin
        .from("translation_cache")
        .upsert(unique.slice(i, i + LOOKUP_CHUNK), { onConflict: "hash,target" });
      if (error) throw new Error(error.message);
    }
  } catch (err) {
    console.error("Translation cache write failed:", err);
  }
}
