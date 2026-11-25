import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const LANGUAGES = ["it", "en", "es", "de", "fr", "zh", "ru", "ar", "hi"] as const;
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

// Languages already pre-translated in this session.
const warmedLanguages = new Set<Lang>();

const STORAGE_KEY = "lang";

// Country (ISO 3166-1 alpha-2, from Cloudflare) → site language, used only when
// the browser does not ask for any of the site's languages.
const COUNTRY_LANG: Record<string, Lang> = {
  IT: "it",
  SM: "it",
  VA: "it",
  DE: "de",
  AT: "de",
  LI: "de",
  ES: "es",
  MX: "es",
  AR: "es",
  CO: "es",
  CL: "es",
  PE: "es",
  VE: "es",
  EC: "es",
  GT: "es",
  CU: "es",
  BO: "es",
  DO: "es",
  HN: "es",
  PY: "es",
  SV: "es",
  NI: "es",
  CR: "es",
  PA: "es",
  UY: "es",
  PR: "es",
  GQ: "es",
  CN: "zh",
  TW: "zh",
  HK: "zh",
  MO: "zh",
  SG: "zh",
  RU: "ru",
  BY: "ru",
  KZ: "ru",
  KG: "ru",
  SA: "ar",
  AE: "ar",
  EG: "ar",
  QA: "ar",
  KW: "ar",
  BH: "ar",
  OM: "ar",
  JO: "ar",
  LB: "ar",
  IQ: "ar",
  SY: "ar",
  YE: "ar",
  MA: "ar",
  DZ: "ar",
  TN: "ar",
  LY: "ar",
  SD: "ar",
  PS: "ar",
  MR: "ar",
  FR: "fr",
  BE: "fr",
  LU: "fr",
  MC: "fr",
  SN: "fr",
  CI: "fr",
  CM: "fr",
  ML: "fr",
  BF: "fr",
  NE: "fr",
  TG: "fr",
  BJ: "fr",
  GA: "fr",
  CG: "fr",
  CD: "fr",
  MG: "fr",
  HT: "fr",
  IN: "hi",
};

const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|mediapartners|facebookexternalhit|embedly|lighthouse|headless|google-inspectiontool|chrome-lighthouse/i;

function isLang(v: unknown): v is Lang {
  return typeof v === "string" && (LANGUAGES as readonly string[]).includes(v);
}

function readStoredLang(): Lang | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return isLang(v) ? v : null;
  } catch {
    return null;
  }
}

/** Visitor location set by the Worker on <html data-visitor-geo="CH-TI">. */
function readGeo(): { country: string; region: string } {
  const raw = document.documentElement.getAttribute("data-visitor-geo") ?? "";
  const [country = "", region = ""] = raw.split("-");
  return { country: country.toUpperCase(), region: region.toUpperCase() };
}

/**
 * Language for a first-time visitor: the browser's preferred languages first,
 * then the country they connect from, then English for foreign visitors and
 * Italian for Italy and Canton Ticino.
 */
export function detectLanguage(): Lang {
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const pref of prefs) {
    const base = (pref ?? "").toLowerCase().split("-")[0];
    if (isLang(base)) return base;
  }
  const { country, region } = readGeo();
  if (!country || country === "XX" || country === "T1") return "it";
  if (country === "CH") {
    if (region === "TI") return "it";
    if (["GE", "VD", "NE", "JU"].includes(region)) return "fr";
    return "de";
  }
  return COUNTRY_LANG[country] ?? "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // The server always renders Italian (what search engines index); the
  // visitor's language is applied right after hydration.
  const [lang, setLangState] = useState<Lang>("it");

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = langDir(lang);
  }, [lang]);

  const applyLang = useCallback((next: Lang) => {
    setLangState(next);
    // Fire-and-forget: pre-translate the whole site into the chosen language so
    // every page is served from the translation cache instead of translating
    // on demand, page by page.
    if (next !== "it" && !warmedLanguages.has(next)) {
      warmedLanguages.add(next);
      void import("@/lib/translate-warmup.functions")
        .then(async (m) => {
          // Each call handles a bounded slice, so resume until nothing is left.
          for (let pass = 0; pass < 12; pass++) {
            const res = await m.warmupTranslations({ data: { target: next } });
            if (!res || res.done || res.remaining === 0) break;
          }
        })
        .catch(() => warmedLanguages.delete(next));
    }
  }, []);

  // First load: the visitor's own choice if they made one, otherwise detect.
  useEffect(() => {
    if (BOT_RE.test(navigator.userAgent) || navigator.webdriver) return;
    const initial = readStoredLang() ?? detectLanguage();
    if (initial !== "it") applyLang(initial);
  }, [applyLang]);

  // A choice made from the language selector is remembered for next visits.
  const setLang = useCallback(
    (next: Lang) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* storage unavailable: the choice lasts for this visit only */
      }
      applyLang(next);
    },
    [applyLang],
  );

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
}catch(e){}})();
`;
