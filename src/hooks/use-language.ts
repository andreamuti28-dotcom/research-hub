import { useCallback, useEffect, useState } from "react";

export type Lang = "it" | "en";
const STORAGE_KEY = "lang_v2";
const EVENT = "langchange";

function read(): Lang {
  if (typeof window === "undefined") return "en";
  return window.localStorage.getItem(STORAGE_KEY) === "it" ? "it" : "en";
}

export function useLanguage() {
  const [lang, setLang] = useState<Lang>("en");

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
  try { localStorage.removeItem('lang'); } catch(_){}
  var l = localStorage.getItem('lang_v2') === 'it' ? 'it' : 'en';
  document.documentElement.lang = l;
}catch(e){}})();
`;
