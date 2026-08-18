import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const LANGUAGES = ["it", "en", "es", "de", "zh", "ru", "ar"] as const;
export type Lang = (typeof LANGUAGES)[number];
export type LangDir = "ltr" | "rtl";

const RTL_LANGUAGES: Lang[] = ["ar"];

export function langDir(lang: Lang): LangDir {
  return RTL_LANGUAGES.includes(lang) ? "rtl" : "ltr";
}

type LanguageContextValue = {
  lang: Lang;
  setLang: (next: Lang) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Always default to Italian on every load. No persistence, no browser detection.
  const [lang, setLangState] = useState<Lang>("it");

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = langDir(lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);

  return createElement(LanguageContext.Provider, { value }, children);
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return { lang: "it" as const, setLang: () => {} };
  }
  return context;
}

export const langBootstrapScript = `
(function(){try{
  document.documentElement.lang = 'it';
  document.documentElement.dir = 'ltr';
  try { localStorage.removeItem('lang'); } catch(_){}
}catch(e){}})();
`;
