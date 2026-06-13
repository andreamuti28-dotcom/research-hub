import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & Cookie — Andrea Muti" },
      {
        name: "description",
        content:
          "Informativa privacy e cookie del sito di Andrea Muti, ricercatore indipendente.",
      },
      { property: "og:title", content: "Privacy & Cookie — Andrea Muti" },
      { property: "og:description", content: "Informativa privacy e cookie del sito." },
      { property: "og:url", content: "https://www.andreamuti.com/privacy" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Privacy & Cookie — Andrea Muti" },
      { name: "twitter:description", content: "Informativa privacy e cookie del sito." },
    ],
    links: [{ rel: "canonical", href: "https://www.andreamuti.com/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const t = useT();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 md:py-24 w-full">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          {t("common.information")}
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tighter italic mb-8">
          {t("privacy.title")}
        </h1>

        <div className="space-y-8 text-pretty text-justify leading-relaxed text-foreground">
          <section>
            <h2 className="font-display text-xl font-bold mb-2">{t("privacy.ownerTitle")}</h2>
            <p>
              {t("privacy.ownerBodyStart")}{" "}
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noreferrer noopener"
                className="underline hover:text-primary"
              >
                {t("common.linkedin")}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">{t("privacy.dataTitle")}</h2>
            <p>{t("privacy.dataBody")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">{t("privacy.storageTitle")}</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t("privacy.storageTech")}</li>
              <li>{t("privacy.storageStats")}</li>
            </ul>
            <p className="mt-3">{t("privacy.noTracking")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">{t("privacy.legalTitle")}</h2>
            <p>{t("privacy.legalBody")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">{t("privacy.withdrawTitle")}</h2>
            <p>{t("privacy.withdrawBody")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">{t("privacy.rightsTitle")}</h2>
            <p>
              {t("privacy.rightsBodyStart")}{" "}
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noreferrer noopener"
                className="underline hover:text-primary"
              >
                {t("common.linkedin")}
              </a>
              . {t("privacy.rightsBodyEnd")} ({" "}
              <a
                href="https://www.garanteprivacy.it"
                target="_blank"
                rel="noreferrer noopener"
                className="underline hover:text-primary"
              >
                garanteprivacy.it
              </a>
              ).
            </p>
          </section>

          <p className="text-xs text-muted-foreground mt-12">
            {t("common.lastUpdated")}: {new Date().toLocaleDateString(t("common.monthLocale"), { month: "long", year: "numeric" })}.
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
