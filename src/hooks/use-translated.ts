import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useLanguage } from "@/hooks/use-language";
import { translateBatch } from "@/lib/translate.functions";

const SOURCE = "it" as const;
const CLIENT_TRANSLATION_CHUNK_SIZE = 50;
const TRANSLATION_QUERY_VERSION = "v4";

type TranslationResult = {
  translations: string[];
  fallback?: boolean;
};

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function cacheKey(target: string, texts: string[]) {
  return `tr:${TRANSLATION_QUERY_VERSION}:${target}:${hash(texts.join("\u0001"))}`;
}

function unwrapTranslations(results: TranslationResult[], fallbackMessage: string) {
  if (results.some((r) => r.fallback)) throw new Error(fallbackMessage);
  return results.flatMap((r) => r.translations);
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
      const chunks: string[][] = [];
      for (let i = 0; i < texts.length; i += CLIENT_TRANSLATION_CHUNK_SIZE) {
        chunks.push(texts.slice(i, i + CLIENT_TRANSLATION_CHUNK_SIZE));
      }
      const results = await Promise.all(
        chunks.map((c) => callFn({ data: { texts: c, target: lang } })),
      );
      return unwrapTranslations(results, "Translation temporarily unavailable");
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
      const chunks: string[][] = [];
      for (let i = 0; i < texts.length; i += CLIENT_TRANSLATION_CHUNK_SIZE) {
        chunks.push(texts.slice(i, i + CLIENT_TRANSLATION_CHUNK_SIZE));
      }
      const results = await Promise.all(
        chunks.map((c) => callFn({ data: { texts: c, target: lang } })),
      );
      return unwrapTranslations(results, "Automatic translation temporarily unavailable");
    },
    enabled: hasContent,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  if (!hasContent) return texts;
  return data ?? texts;
}
