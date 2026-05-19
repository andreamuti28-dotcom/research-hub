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

export function formatLanguage(lang: PaperLanguage): string {
  if (lang === "it") return "IT";
  if (lang === "en") return "EN";
  return "IT · EN";
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
