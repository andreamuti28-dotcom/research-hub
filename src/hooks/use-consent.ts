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

const MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 12 mesi, come da cookie policy

function read(): ConsentState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    // Consideriamo valida solo una scelta esplicita e non scaduta.
    const explicit = parsed?.decision === "accept" || parsed?.decision === "reject" || parsed?.decision === "custom";
    const ts = typeof parsed?.ts === "number" ? parsed.ts : 0;
    if (!explicit || !ts || Date.now() - ts > MAX_AGE_MS) {
      window.localStorage.removeItem(KEY);
      return DEFAULT;
    }
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

function write(prefs: ConsentPrefs, decision: "accept" | "reject" | "custom") {
  window.localStorage.setItem(
    KEY,
    JSON.stringify({ prefs, decision, ts: Date.now() }),
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
