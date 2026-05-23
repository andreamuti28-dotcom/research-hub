import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useLanguage } from "@/hooks/use-language";
import { translateBatch } from "@/lib/translate.functions";

const SOURCE = "it" as const;

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function cacheKey(target: string, texts: string[]) {
  return `tr:${target}:${hash(texts.join("\u0001"))}`;
}

function readCache(key: string): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as string[];
  } catch {
    return null;
  }
}

function writeCache(key: string, value: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota */
  }
}

/**
 * Translate a stable list of strings to the current UI language.
 * When language equals source (it), returns originals immediately.
 */
export function useTranslated(texts: string[]): string[] {
  const { lang } = useLanguage();
  const callFn = useServerFn(translateBatch);
  const needsTranslation = lang !== SOURCE && texts.some((t) => t.trim().length > 0);
  const key = cacheKey(lang, texts);

  const { data } = useQuery({
    queryKey: ["translate", key],
    queryFn: async () => {
      const cached = readCache(key);
      if (cached && cached.length === texts.length) return cached;
      const CHUNK = 40;
      const out: string[] = [];
      for (let i = 0; i < texts.length; i += CHUNK) {
        const chunk = texts.slice(i, i + CHUNK);
        const res = await callFn({ data: { texts: chunk, target: lang } });
        out.push(...res.translations);
      }
      writeCache(key, out);
      return out;
    },
    enabled: needsTranslation,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  if (!needsTranslation) return texts;
  return data ?? texts;
}
