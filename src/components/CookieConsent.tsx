import { Link } from "@tanstack/react-router";
import { useConsent } from "@/hooks/use-consent";

export function CookieConsent() {
  const { consent, accept, decline } = useConsent();
  if (consent !== null) return null;
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Informativa cookie"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[60] border border-border bg-background shadow-lg p-4 animate-fade-up"
    >
      <p className="text-xs leading-relaxed text-foreground mb-3">
        Uso solo cookie tecnici e un identificatore anonimo per contare le visite. Nessuna
        profilazione, nessun tracker pubblicitario.{" "}
        <Link to="/privacy" className="underline hover:text-primary">
          Maggiori info
        </Link>
        .
      </p>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={decline}
          className="px-3 py-1.5 text-[11px] font-display uppercase tracking-wider border border-border hover:bg-muted transition-colors"
        >
          Rifiuta
        </button>
        <button
          type="button"
          onClick={accept}
          className="px-3 py-1.5 text-[11px] font-display font-bold uppercase tracking-wider bg-foreground text-background hover:bg-primary transition-colors"
        >
          Accetta
        </button>
      </div>
    </div>
  );
}
