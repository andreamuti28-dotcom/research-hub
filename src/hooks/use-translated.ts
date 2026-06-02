import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useLanguage } from "@/hooks/use-language";
import { translateBatch } from "@/lib/translate.functions";

const SOURCE = "it" as const;
const CLIENT_TRANSLATION_CHUNK_SIZE = 50;

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
      const chunks: string[][] = [];
      for (let i = 0; i < texts.length; i += CLIENT_TRANSLATION_CHUNK_SIZE) {
        chunks.push(texts.slice(i, i + CLIENT_TRANSLATION_CHUNK_SIZE));
      }
      const results = await Promise.all(
        chunks.map((c) => callFn({ data: { texts: c, target: lang } })),
      );
      const out = results.flatMap((r) => r.translations);
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

/**
 * Translate to the current UI language regardless of the source language.
 * Use for content whose source language is unknown or non-Italian (e.g. news
 * feeds in English). The translator keeps already-target texts as-is.
 */
export function useTranslatedAlways(texts: string[]): string[] {
  const { lang } = useLanguage();
  const callFn = useServerFn(translateBatch);
  const hasContent = texts.some((t) => t.trim().length > 0);
  const key = `auto:${cacheKey(lang, texts)}`;

  const { data } = useQuery({
    queryKey: ["translate-auto", key],
    queryFn: async () => {
      const cached = readCache(key);
      if (cached && cached.length === texts.length) return cached;
      const chunks: string[][] = [];
      for (let i = 0; i < texts.length; i += CLIENT_TRANSLATION_CHUNK_SIZE) {
        chunks.push(texts.slice(i, i + CLIENT_TRANSLATION_CHUNK_SIZE));
      }
      const results = await Promise.all(
        chunks.map((c) => callFn({ data: { texts: c, target: lang } })),
      );
      const out = results.flatMap((r) => r.translations);
      writeCache(key, out);
      return out;
    },
    enabled: hasContent,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  if (!hasContent) return texts;
  return data ?? texts;
}
