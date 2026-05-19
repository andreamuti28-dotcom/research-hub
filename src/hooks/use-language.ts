import { useCallback, useEffect, useState } from "react";

export type Lang = "it" | "en";
const STORAGE_KEY = "lang";
const EVENT = "langchange";

function read(): Lang {
  if (typeof window === "undefined") return "it";
  return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "it";
}

export function useLanguage() {
  const [lang, setLang] = useState<Lang>("it");

  useEffect(() => {
    setLang(read());
    const h = () => setLang(read());
    window.addEventListener(EVENT, h);
    return () => window.removeEventListener(EVENT, h);
  }, []);

  const change = useCallback((next: Lang) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { lang, setLang: change };
}

export const langBootstrapScript = `
(function(){try{
  var l = localStorage.getItem('lang') === 'en' ? 'en' : 'it';
  document.documentElement.lang = l;
}catch(e){}})();
`;
