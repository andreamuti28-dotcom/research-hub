import type { Lang } from "@/hooks/use-language";

export type PaperLanguage = "it" | "en" | "both";

export interface Paper {
  id: string;
  slug: string;
  title: string;
  abstract: string;
  content: string;
  tags: string[];
  pdfUrl: string | null;
  publishedDate: string;
  isPublished: boolean;
  views: number;
  downloads: number;
  language: PaperLanguage;
}

const LOCALE_MAP: Record<Lang, string> = {
  it: "it-IT",
  en: "en-GB",
  es: "es-ES",
  de: "de-DE",
  zh: "zh-CN",
  ru: "ru-RU",
  ar: "ar-SA",
};

export function formatLanguage(lang: PaperLanguage): string {
  if (lang === "it") return "🇮🇹";
  if (lang === "en") return "🇬🇧";
  return "🇮🇹 🇬🇧";
}

export function languageLabel(lang: PaperLanguage): string {
  if (lang === "it") return "Italiano";
  if (lang === "en") return "Inglese";
  return "Italiano e Inglese";
}

export function formatDate(iso: string, lang: Lang = "it"): string {
  return new Date(iso).toLocaleDateString(LOCALE_MAP[lang] ?? "it-IT", {
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(iso: string, lang: Lang = "it"): string {
  return new Date(iso).toLocaleDateString(LOCALE_MAP[lang] ?? "it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
