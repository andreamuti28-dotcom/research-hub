import { useLanguage } from "@/hooks/use-language";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const next = lang === "it" ? "en" : "it";
  const flag = lang === "it" ? "🇮🇹" : "🇬🇧";
  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={`Language: ${lang.toUpperCase()} → ${next.toUpperCase()}`}
      title={`${lang.toUpperCase()} → ${next.toUpperCase()}`}
      className="inline-flex items-center justify-center w-8 h-8 rounded-xs border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors text-base leading-none"
    >
      <span className="select-none">{flag}</span>
    </button>
  );
}
