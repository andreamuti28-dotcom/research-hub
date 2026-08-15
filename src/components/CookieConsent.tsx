import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useConsent } from "@/hooks/use-consent";
import { useT } from "@/lib/i18n";

export function CookieConsent() {
  const { state, acceptAll, rejectAll, savePrefs } = useConsent();
  const t = useT();
  const [showPrefs, setShowPrefs] = useState(false);
  const [statistics, setStatistics] = useState(false);

  if (state.decided) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-live="polite"
      aria-label={t("cookie.dialogLabel")}
      className="fixed bottom-3 left-3 right-3 sm:bottom-4 sm:left-auto sm:right-4 sm:max-w-md z-[60] border border-border bg-background shadow-lg p-3 sm:p-4 animate-fade-up"
    >
      {!showPrefs ? (
        <>
          <p className="text-[11px] sm:text-xs leading-snug sm:leading-relaxed text-foreground mb-2.5 sm:mb-3 line-clamp-4 sm:line-clamp-none">
            {t("cookie.notice")}{" "}
            <Link to="/cookie-policy" className="underline hover:text-primary">
              {t("common.cookiePolicy")}
            </Link>
            {" · "}
            <Link to="/privacy" className="underline hover:text-primary">
              {t("common.privacy")}
            </Link>
            .
          </p>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowPrefs(true)}
              className="px-3 py-1.5 text-[11px] font-display uppercase tracking-wider border border-border hover:bg-muted transition-colors"
            >
              {t("cookie.manage")}
            </button>
            <button
              type="button"
              onClick={rejectAll}
              className="px-3 py-1.5 text-[11px] font-display uppercase tracking-wider border border-border hover:bg-muted transition-colors"
            >
              {t("cookie.reject")}
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="px-3 py-1.5 text-[11px] font-display font-bold uppercase tracking-wider bg-foreground text-background hover:bg-primary transition-colors"
            >
              {t("cookie.accept")}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="text-xs font-display font-bold uppercase tracking-widest mb-3">
            {t("cookie.preferences")}
          </p>
          <div className="space-y-3 mb-4">
            <label className="flex items-start gap-3 text-xs">
              <input
                type="checkbox"
                checked
                disabled
                className="mt-0.5 accent-foreground"
                aria-label={t("cookie.technicalLabel")}
              />
              <span>
                <strong>{t("cookie.technicalName")}</strong> {t("cookie.technicalText")}
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
                <strong>{t("cookie.analyticsName")}</strong>. {t("cookie.analyticsText")}
              </span>
            </label>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowPrefs(false)}
              className="px-3 py-1.5 text-[11px] font-display uppercase tracking-wider border border-border hover:bg-muted transition-colors"
            >
              {t("cookie.back")}
            </button>
            <button
              type="button"
              onClick={() => savePrefs({ statistics })}
              className="px-3 py-1.5 text-[11px] font-display font-bold uppercase tracking-wider bg-foreground text-background hover:bg-primary transition-colors"
            >
              {t("cookie.save")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
