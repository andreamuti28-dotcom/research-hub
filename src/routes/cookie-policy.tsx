import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useConsent } from "@/hooks/use-consent";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/cookie-policy")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — Andrea Muti" },
      {
        name: "description",
        content:
          "Elenco dei cookie e degli identificatori usati da questo sito, finalità, durata e modalità di revoca del consenso.",
      },
      { property: "og:title", content: "Cookie Policy — Andrea Muti" },
      { property: "og:description", content: "Cookie usati dal sito e gestione del consenso." },
      { property: "og:url", content: "https://www.andreamuti.com/cookie-policy" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Cookie Policy — Andrea Muti" },
      { name: "twitter:description", content: "Cookie usati dal sito e gestione del consenso." },
    ],
    links: [{ rel: "canonical", href: "https://www.andreamuti.com/cookie-policy" }],
  }),
  component: CookiePolicyPage,
});

function CookiePolicyPage() {
  const { reopen } = useConsent();
  const t = useT();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 md:py-24 w-full">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          {t("common.information")}
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tighter italic mb-8">
          {t("cookiePage.title")}
        </h1>

        <div className="space-y-8 leading-relaxed text-foreground">
          <section>
            <h2 className="font-display text-xl font-bold mb-2">{t("cookiePage.whatTitle")}</h2>
            <p>{t("cookiePage.whatBody")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">{t("cookiePage.usedTitle")}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-display">{t("cookiePage.name")}</th>
                    <th className="text-left p-3 font-display">{t("cookiePage.category")}</th>
                    <th className="text-left p-3 font-display">{t("cookiePage.purpose")}</th>
                    <th className="text-left p-3 font-display">{t("cookiePage.duration")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="p-3 font-mono text-xs">theme</td>
                    <td className="p-3">{t("cookiePage.technical")}</td>
                    <td className="p-3">{t("cookiePage.themePurpose")}</td>
                    <td className="p-3">{t("cookiePage.persistent")}</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-3 font-mono text-xs">lang</td>
                    <td className="p-3">{t("cookiePage.technical")}</td>
                    <td className="p-3">{t("cookiePage.languagePurpose")}</td>
                    <td className="p-3">{t("cookiePage.persistent")}</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-3 font-mono text-xs">cookie_consent_v2</td>
                    <td className="p-3">{t("cookiePage.technical")}</td>
                    <td className="p-3">{t("cookiePage.consentPurpose")}</td>
                    <td className="p-3">{t("cookiePage.months12")}</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-3 font-mono text-xs">visitor_token</td>
                    <td className="p-3">{t("cookiePage.statsCategory")}</td>
                    <td className="p-3">{t("cookiePage.statsPurpose")}</td>
                    <td className="p-3">{t("cookiePage.persistent")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">{t("cookiePage.thirdTitle")}</h2>
            <p>{t("cookiePage.thirdBody")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">{t("cookiePage.consentTitle")}</h2>
            <p>{t("cookiePage.consentBody")}</p>
            <button
              type="button"
              onClick={reopen}
              className="mt-4 px-4 py-2 text-xs font-display font-bold uppercase tracking-widest border-2 border-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              {t("cookiePage.edit")}
            </button>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">{t("cookiePage.refsTitle")}</h2>
            <p>
              {t("cookiePage.refsBody")}{" "}
              <Link to="/privacy" className="underline hover:text-primary">
                {t("common.privacyPolicy")}
              </Link>
              .
            </p>
          </section>

          <p className="text-xs text-muted-foreground mt-12">
            {t("common.lastUpdated")}: {" "}
            {new Date().toLocaleDateString(t("common.monthLocale"), { month: "long", year: "numeric" })}.
          </p>
        </div>

        <div className="mt-12">
          <Link
            to="/"
            className="font-display text-xs font-bold uppercase tracking-widest border-b-2 border-foreground pb-0.5 hover:text-primary hover:border-primary transition-all"
          >
            {t("common.backHome")}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
