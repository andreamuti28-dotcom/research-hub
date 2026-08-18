import { useLanguage } from "@/hooks/use-language";
import { useTranslated } from "@/hooks/use-translated";

type DashboardLike = {
  title: string;
  title_en: string | null;
  description: string | null;
  description_en: string | null;
};

export type DashboardLabels = { title: string; description: string | null };

/**
 * Localize dashboard titles/descriptions.
 * - it: original Italian
 * - en: curated English fields when present, otherwise auto-translation
 * - other languages: auto-translation from the Italian source
 */
export function useDashboardLabels(items: DashboardLike[]): DashboardLabels[] {
  const { lang } = useLanguage();
  const texts = items.flatMap((d) => [d.title, d.description ?? ""]);
  const translated = useTranslated(texts);

  return items.map((d, i) => {
    if (lang === "it") return { title: d.title, description: d.description };
    const trTitle = translated[i * 2] ?? d.title;
    const trDesc = translated[i * 2 + 1] ?? d.description ?? "";
    if (lang === "en") {
      return {
        title: d.title_en || trTitle,
        description: d.description_en || trDesc || null,
      };
    }
    return { title: trTitle, description: trDesc || null };
  });
}
