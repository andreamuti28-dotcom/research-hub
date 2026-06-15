import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "it" | "en";
type LanguageContextValue = {
  lang: Lang;
  setLang: (next: Lang) => void;
};

const STORAGE_KEY = "lang";
const LanguageContext = createContext<LanguageContextValue | null>(null);

function readStoredLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "it" || v === "en") return v;
  } catch (_) {}
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // SSR/first render: English (avoids hydration mismatch). Then sync to localStorage.
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = readStoredLang();
    if (stored !== lang) setLangState(stored);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch (_) {}
  }, []);

  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);

  return createElement(LanguageContext.Provider, { value }, children);
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return { lang: "en" as const, setLang: () => {} };
  }
  return context;
}

export const langBootstrapScript = `
(function(){try{
  var v = null;
  try { v = localStorage.getItem('lang'); } catch(_){}
  if (v !== 'it' && v !== 'en') v = 'en';
  document.documentElement.lang = v;
}catch(e){}})();
`;
