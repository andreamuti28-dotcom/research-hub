import { useState, useRef, useEffect } from "react";
import { useLanguage, LANGUAGES, type Lang } from "@/hooks/use-language";
import { LanguageFlags } from "@/components/Flag";
import { useT } from "@/lib/i18n";

const LANG_LABELS: Record<Lang, string> = {
  it: "Italiano",
  en: "English",
  es: "Español",
  de: "Deutsch",
  zh: "中文",
  ru: "Русский",
  ar: "العربية",
};

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const t = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("langToggle.label", LANG_LABELS[lang], t("lang.next"))}
        title={t("langToggle.label", LANG_LABELS[lang], t("lang.next"))}
        className="inline-flex items-center justify-center gap-1.5 w-auto px-2 h-8 rounded-xs border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
      >
        <LanguageFlags language={lang} className="w-5 h-auto" />
        <span className="text-xs font-medium hidden sm:inline">{LANG_LABELS[lang]}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 min-w-[10rem] rounded-md border border-border bg-popover shadow-lg z-50 overflow-hidden">
          {LANGUAGES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                setLang(l);
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors hover:bg-accent ${
                l === lang ? "bg-accent/50 font-medium" : ""
              }`}
            >
              <LanguageFlags language={l} className="w-5 h-auto" />
              <span>{LANG_LABELS[l]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
