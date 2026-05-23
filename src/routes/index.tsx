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
  const [featuredOpen, setFeaturedOpen] = useState(false);

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

      <section className="max-w-6xl mx-auto px-6 pt-16 md:pt-24 pb-12 md:pb-16 w-full">
        <div className="animate-fade-up grid md:grid-cols-12 gap-8 md:gap-12 items-start">
          <div className="md:col-span-7">
            <h1 className="text-4xl md:text-6xl font-display font-bold tracking-tighter leading-[0.95] text-balance mb-6 italic">
              {heroTitle}
            </h1>
          </div>
          <div className="md:col-span-5 md:pt-2">
            <div className="text-base md:text-lg leading-relaxed text-pretty text-muted-foreground space-y-4 md:border-l md:border-border md:pl-6">
              <p className="whitespace-pre-line">{heroIntro}</p>
            </div>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="border-t border-border bg-background">
          <div className="max-w-6xl mx-auto px-6">
            <button
              type="button"
              onClick={() => setFeaturedOpen((v) => !v)}
              aria-expanded={featuredOpen}
              className="group w-full flex items-center justify-between gap-6 py-7 md:py-9 text-left transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="inline-flex items-center font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-foreground/10 text-foreground shrink-0">
                  {t("home.featuredKicker")}
                </span>
                <h2 className="text-xl md:text-2xl font-display font-bold tracking-tighter italic truncate group-hover:text-primary transition-colors">
                  {settings.homeFeaturedLabel || t("home.featuredTitle")}
                </h2>
              </div>
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border text-base font-bold transition-all group-hover:border-primary group-hover:text-primary shrink-0"
                style={{ transform: featuredOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                aria-hidden
              >
                +
              </span>
            </button>
            {featuredOpen && (
              <div className="pb-10 md:pb-14 animate-fade-up">
                <div className="space-y-px bg-border border border-border">
                  {featured.map((p) => (
                    <PaperRow key={p.id} paper={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {settings.homeMarketEnabled && (
        <section className="border-t border-border bg-background">
          <div className="max-w-6xl mx-auto px-6">
            <button
              type="button"
              onClick={() => setMarketOpen((v) => !v)}
              aria-expanded={marketOpen}
              className="group w-full flex items-center justify-between gap-6 py-7 md:py-9 text-left transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-primary/10 text-primary shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Live
                </span>
                <h2 className="text-xl md:text-2xl font-display font-bold tracking-tighter italic truncate group-hover:text-primary transition-colors">
                  {settings.homeMarketLabel}
                </h2>
              </div>
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border text-base font-bold transition-all group-hover:border-primary group-hover:text-primary shrink-0"
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
