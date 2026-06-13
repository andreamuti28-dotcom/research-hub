import { useLanguage } from "@/hooks/use-language";
import { Flag } from "@/components/Flag";
import { useT } from "@/lib/i18n";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const t = useT();
  const next = lang === "it" ? "en" : "it";
  const currentLabel = lang === "it" ? t("lang.it") : t("lang.en");
  const nextLabel = next === "it" ? t("lang.it") : t("lang.en");
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={t("langToggle.label", currentLabel, nextLabel)}
      title={t("langToggle.label", currentLabel, nextLabel)}
      className="inline-flex items-center justify-center w-8 h-8 rounded-xs border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
    >
      <Flag country={next === "it" ? "it" : "gb"} className="w-5 h-auto" />
    </button>
  );
}
