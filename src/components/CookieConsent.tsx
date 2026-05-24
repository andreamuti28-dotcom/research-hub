import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useConsent } from "@/hooks/use-consent";

export function CookieConsent() {
  const { state, acceptAll, rejectAll, savePrefs } = useConsent();
  const [showPrefs, setShowPrefs] = useState(false);
  const [statistics, setStatistics] = useState(false);

  if (state.decided) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-live="polite"
      aria-label="Informativa cookie"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-[60] border border-border bg-background shadow-lg p-4 animate-fade-up"
    >
      {!showPrefs ? (
        <>
          <p className="text-xs leading-relaxed text-foreground mb-3">
            Uso cookie tecnici (sempre attivi) e, solo previo consenso, un identificatore
            anonimo per contare le visite in forma aggregata. Nessuna profilazione, nessun
            tracker pubblicitario, nessuna terza parte di marketing.{" "}
            <Link to="/cookie-policy" className="underline hover:text-primary">
              Cookie Policy
            </Link>
            {" · "}
            <Link to="/privacy" className="underline hover:text-primary">
              Privacy
            </Link>
            .
          </p>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowPrefs(true)}
              className="px-3 py-1.5 text-[11px] font-display uppercase tracking-wider border border-border hover:bg-muted transition-colors"
            >
              Gestisci preferenze
            </button>
            <button
              type="button"
              onClick={rejectAll}
              className="px-3 py-1.5 text-[11px] font-display uppercase tracking-wider border border-border hover:bg-muted transition-colors"
            >
              Rifiuta
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="px-3 py-1.5 text-[11px] font-display font-bold uppercase tracking-wider bg-foreground text-background hover:bg-primary transition-colors"
            >
              Accetta
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs font-display font-bold uppercase tracking-widest mb-3">
            Preferenze cookie
          </p>
          <div className="space-y-3 mb-4">
            <label className="flex items-start gap-3 text-xs">
              <input
                type="checkbox"
                checked
                disabled
                className="mt-0.5 accent-foreground"
                aria-label="Cookie tecnici (obbligatori)"
              />
              <span>
                <strong>Tecnici</strong> (sempre attivi). Necessari al funzionamento:
                tema, lingua, sessione.
              </span>
            </label>
            <label className="flex items-start gap-3 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={statistics}
                onChange={(e) => setStatistics(e.target.checked)}
                className="mt-0.5 accent-foreground"
              />
              <span>
                <strong>Statistici anonimi</strong>. Token casuale per il conteggio
                aggregato delle visite. Nessun dato personale.
              </span>
            </label>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowPrefs(false)}
              className="px-3 py-1.5 text-[11px] font-display uppercase tracking-wider border border-border hover:bg-muted transition-colors"
            >
              Indietro
            </button>
            <button
              type="button"
              onClick={() => savePrefs({ statistics })}
              className="px-3 py-1.5 text-[11px] font-display font-bold uppercase tracking-wider bg-foreground text-background hover:bg-primary transition-colors"
            >
              Salva preferenze
            </button>
          </div>
        </>
      )}
    </div>
  );
}
