import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PaperRow } from "@/components/PaperRow";
import { listPublishedPapers } from "@/lib/papers.functions";
import { siteSettingsQuery } from "@/hooks/use-site-settings";
import { getLatestMarketReport } from "@/lib/market-reports.functions";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { useTranslated } from "@/hooks/use-translated";

const papersQuery = {
  queryKey: ["papers", "published"] as const,
  queryFn: () => listPublishedPapers(),
  staleTime: 0,
  refetchOnMount: "always" as const,
};

const latestMarketReportQuery = {
  queryKey: ["market-reports", "latest"] as const,
  queryFn: () => getLatestMarketReport(),
  staleTime: 0,
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Andrea Muti — Ricerca autonoma" },
      {
        name: "description",
        content:
          "Archivio di paper e saggi di ricerca indipendente sull'intersezione tra etica digitale, infrastrutture e cognizione.",
      },
      { property: "og:title", content: "Andrea Muti — Ricerca autonoma" },
      {
        property: "og:description",
        content:
          "Paper di ricerca autonoma su etica digitale, infrastrutture e modelli linguistici.",
      },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(papersQuery),
      context.queryClient.ensureQueryData(siteSettingsQuery),
      context.queryClient.ensureQueryData(latestMarketReportQuery),
    ]),
  component: Index,
});

function Index() {
  const { data: papers } = useSuspenseQuery(papersQuery);
  const { data: settings } = useSuspenseQuery(siteSettingsQuery);
  const { data: latestReport } = useQuery(latestMarketReportQuery);
  const queryClient = useQueryClient();
  const t = useT();
  const [heroTitle, heroIntro] = useTranslated([
    settings.heroTitle,
    settings.heroIntro,
  ]);
  const [marketOpen, setMarketOpen] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel("market-reports-home")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "market_reports" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["market-reports"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const featured = settings.featuredPaperIds
    .map((id) => papers.find((p) => p.id === id))
    .filter((p): p is (typeof papers)[number] => Boolean(p));
  const featuredIds = new Set(featured.map((p) => p.id));
  const latest = papers.filter((p) => !featuredIds.has(p.id)).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 w-full">
        <div className="animate-fade-up">
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tighter leading-[0.95] text-balance mb-8 italic max-w-[20ch]">
            {heroTitle}
          </h1>
          <div className="max-w-[55ch] text-lg md:text-xl leading-relaxed text-pretty space-y-6">
            <p className="whitespace-pre-line">{heroIntro}</p>
          </div>
        </div>
      </section>

      {settings.homeMarketEnabled && (
        <section className="border-t border-border bg-background">
          <div className="max-w-6xl mx-auto px-6">
            <button
              type="button"
              onClick={() => setMarketOpen((v) => !v)}
              aria-expanded={marketOpen}
              className="w-full flex items-center justify-between gap-4 py-6 md:py-8 text-left hover:text-primary transition-colors"
            >
              <div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                  Live
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold tracking-tighter italic">
                  {settings.homeMarketLabel}
                </h2>
              </div>
              <span
                className="font-display text-2xl font-bold transition-transform shrink-0"
                style={{ transform: marketOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                aria-hidden
              >
                +
              </span>
            </button>
            {marketOpen && (
              <div className="pb-10 md:pb-14 animate-fade-up">
                {latestReport ? (
                  <article className="border border-border bg-surface p-6 md:p-8">
                    <div className="flex flex-wrap items-baseline gap-3 mb-4">
                      <h3 className="font-display text-xl font-bold tracking-tight">
                        {latestReport.title}
                      </h3>
                      <time className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                        {new Date(latestReport.reportDate).toLocaleDateString("it-IT", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </time>
                      {latestReport.source && (
                        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          · {latestReport.source}
                        </span>
                      )}
                    </div>
                    <div className="max-w-none whitespace-pre-line text-pretty leading-relaxed text-base">
                      {latestReport.content}
                    </div>
                    <div className="mt-6">
                      <Link
                        to="/archivio"
                        className="font-display text-xs font-bold uppercase tracking-widest border-b-2 border-foreground pb-0.5 hover:text-primary hover:border-primary transition-all"
                      >
                        Archivio report →
                      </Link>
                    </div>
                  </article>
                ) : (
                  <div className="border border-border p-10 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground bg-surface">
                    Nessun report disponibile.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="border-t border-border bg-background py-20 md:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <div className="mb-12 md:mb-16">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                {t("home.featuredKicker")}
              </div>
              <h2 className="text-3xl font-display font-bold tracking-tighter italic">
                {settings.homeFeaturedLabel || t("home.featuredTitle")}
              </h2>
            </div>
            <div className="space-y-px bg-border border border-border">
              {featured.map((p) => (
                <PaperRow key={p.id} paper={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-border bg-surface py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                {t("home.latestKicker")}
              </div>
              <h2 className="text-3xl font-display font-bold tracking-tighter">
                {t("home.latestTitle")}
              </h2>
            </div>
            <Link
              to="/archivio"
              className="inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest border-b-2 border-foreground pb-1 hover:text-primary hover:border-primary transition-all self-start md:self-auto"
            >
              {t("home.seeArchive")}
            </Link>
          </div>

          {latest.length === 0 ? (
            <div className="border border-border p-12 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground bg-background">
              {t("home.empty")}
            </div>
          ) : (
            <div className="space-y-px bg-border border border-border">
              {latest.map((p) => (
                <PaperRow key={p.id} paper={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="flex-1" />
      <SiteFooter />
    </div>
  );
}
