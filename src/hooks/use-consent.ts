import { useCallback, useEffect, useState } from "react";

const KEY = "cookie_consent_v2";
const EVENT = "consentchange";

export type ConsentPrefs = {
  necessary: true; // sempre attivi (tecnici)
  statistics: boolean; // conteggio visite anonimo
};

export type ConsentState = {
  decided: boolean;
  prefs: ConsentPrefs;
};

const DEFAULT: ConsentState = {
  decided: false,
  prefs: { necessary: true, statistics: false },
};

function read(): ConsentState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    return {
      decided: true,
      prefs: {
        necessary: true,
        statistics: !!parsed?.prefs?.statistics,
      },
    };
  } catch {
    return DEFAULT;
  }
}

function write(prefs: ConsentPrefs) {
  window.localStorage.setItem(
    KEY,
    JSON.stringify({ prefs, ts: Date.now() }),
  );
  window.dispatchEvent(new Event(EVENT));
}

export function useConsent() {
  const [state, setState] = useState<ConsentState>(DEFAULT);

  useEffect(() => {
    setState(read());
    const h = () => setState(read());
    window.addEventListener(EVENT, h);
    return () => window.removeEventListener(EVENT, h);
  }, []);

  const acceptAll = useCallback(() => {
    write({ necessary: true, statistics: true });
  }, []);
  const rejectAll = useCallback(() => {
    write({ necessary: true, statistics: false });
  }, []);
  const savePrefs = useCallback((p: Partial<ConsentPrefs>) => {
    write({ necessary: true, statistics: !!p.statistics });
  }, []);
  const reopen = useCallback(() => {
    window.localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  // back-compat helpers for existing call sites
  const consent: "accepted" | "declined" | null = !state.decided
    ? null
    : state.prefs.statistics
      ? "accepted"
      : "declined";

  return {
    state,
    consent,
    acceptAll,
    rejectAll,
    savePrefs,
    reopen,
    // legacy aliases
    accept: acceptAll,
    decline: rejectAll,
  };
}
