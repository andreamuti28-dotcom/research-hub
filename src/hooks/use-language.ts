import { useCallback, useEffect, useState } from "react";

export type Lang = "it" | "en";
const EVENT = "langchange";

// Language is intentionally NOT persisted: the site must always open in
// English. The flag switches to Italian only for the current visit.
let current: Lang = "en";

export function useLanguage() {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    setLang(current);
    const h = () => setLang(current);
    window.addEventListener(EVENT, h);
    return () => window.removeEventListener(EVENT, h);
  }, []);

  const change = useCallback((next: Lang) => {
    current = next;
    document.documentElement.lang = next;
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { lang, setLang: change };
}

export const langBootstrapScript = `
(function(){try{
  try { localStorage.removeItem('lang'); localStorage.removeItem('lang_v2'); } catch(_){}
  document.documentElement.lang = 'en';
}catch(e){}})();
`;
