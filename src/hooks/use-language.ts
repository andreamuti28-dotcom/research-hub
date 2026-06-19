import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "it" | "en";
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
  try { localStorage.removeItem('lang'); } catch(_){}
}catch(e){}})();
`;
