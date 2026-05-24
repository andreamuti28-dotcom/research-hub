import { useCallback, useEffect, useState } from "react";

const KEY = "cookie_consent_v1";
const EVENT = "consentchange";

export type Consent = "accepted" | "declined" | null;

function read(): Consent {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v === "accepted" || v === "declined" ? v : null;
}

export function useConsent() {
  const [consent, setConsent] = useState<Consent>(null);

  useEffect(() => {
    setConsent(read());
    const h = () => setConsent(read());
    window.addEventListener(EVENT, h);
    return () => window.removeEventListener(EVENT, h);
  }, []);

  const set = useCallback((next: Exclude<Consent, null>) => {
    window.localStorage.setItem(KEY, next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { consent, accept: () => set("accepted"), decline: () => set("declined") };
}
