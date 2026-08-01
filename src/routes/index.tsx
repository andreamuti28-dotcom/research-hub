import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PaperRow } from "@/components/PaperRow";
import { listPublishedPapers } from "@/lib/papers.functions";
import { siteSettingsQuery } from "@/hooks/use-site-settings";
import { getLatestMarketReport } from "@/lib/market-reports.functions";
import { recordSiteVisit } from "@/lib/site-visits.functions";
import { listPublishedDashboards } from "@/lib/dashboards.functions";
import { dashboardPath } from "@/lib/dashboard-registry";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { useTranslated } from "@/hooks/use-translated";
import { useServerFn } from "@tanstack/react-start";
import { formatMarketReportLayout } from "@/lib/format-layout.functions";
import { formatReportLocal } from "@/lib/format-report-local";
import { useLanguage } from "@/hooks/use-language";
import { useConsent } from "@/hooks/use-consent";
import { FinancialNewsSection } from "@/components/FinancialNewsSection";

const HERO_INTRO_IT =
  "Studente di Economia e finanza. Pubblico analisi tecniche su risk management, derivati, crypto, mercati finanziari e geopolitica.";
const HERO_INTRO_EN =
  "Economics and Finance student. I publish technical analysis on risk management, derivatives, crypto, financial markets and geopolitics.";
const HERO_TITLE_FIXED = "Andrea Muti - Finanza";
const HOME_FEATURED_LABEL_IT = "Pubblicazioni in evidenza";
const HOME_FEATURED_LABEL_EN = "Featured publications";
const HOME_MARKET_LABEL_IT = "Analisi dei Mercati Finanziari";
const HOME_MARKET_LABEL_EN = "Financial Market Analysis";

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

const dashboardsQuery = {
  queryKey: ["dashboards", "published"] as const,
  queryFn: () => listPublishedDashboards(),
  staleTime: 60_000,
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Andrea Muti - Finanza" },
      {
        name: "description",
        content:
          "Studente di Economia e finanza. Pubblico analisi tecniche su risk management, derivati, crypto, mercati finanziari e geopolitica.",
      },
      { property: "og:title", content: "Andrea Muti - Finanza" },
      {
        property: "og:description",
        content:
          "Studente di Economia e finanza. Pubblico analisi tecniche su risk management, derivati, crypto, mercati finanziari e geopolitica.",
      },
      { property: "og:url", content: "https://www.andreamuti.com/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Andrea Muti - Finanza" },
      {
        name: "twitter:description",
        content:
          "Studente di Economia e finanza. Pubblico analisi tecniche su risk management, derivati, crypto, mercati finanziari e geopolitica.",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.andreamuti.com/" }],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(papersQuery),
      context.queryClient.ensureQueryData(siteSettingsQuery),
      context.queryClient.ensureQueryData(latestMarketReportQuery),
      context.queryClient.ensureQueryData(dashboardsQuery),
    ]),
  component: Index,
});

function Index() {
  const { data: papers } = useSuspenseQuery(papersQuery);
  const { data: settings } = useSuspenseQuery(siteSettingsQuery);
  const { data: latestReport } = useQuery(latestMarketReportQuery);
  const { data: dashboards = [] } = useQuery(dashboardsQuery);
  const queryClient = useQueryClient();
  const t = useT();
  const { lang } = useLanguage();
  const dateLocale = lang === "en" ? "en-GB" : "it-IT";
  // Always format the raw Italian Google Doc into markdown first, regardless
  // of the current UI language. This way EN translation receives already-
  // structured markdown (headings, lists, blank lines) instead of a wall of
  // uppercase text.
  const formatFn = useServerFn(formatMarketReportLayout);
  const rawContent = latestReport?.content ?? "";
  const { data: formattedIt } = useQuery({
    queryKey: ["market-report-format-it", latestReport?.id ?? "none"],
    queryFn: () => formatFn({ data: { text: rawContent } }),
    enabled: rawContent.trim().length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const formattedItText = formattedIt?.text ?? rawContent;
  const [
    heroTitle,
    heroIntro,
    marketDisclaimer,
    marketLabel,
    featuredLabel,
    reportTitle,
    reportContentTranslated,
  ] = useTranslated([
    settings.heroTitle,
    settings.heroIntro,
    settings.homeMarketDisclaimer,
    settings.homeMarketLabel,
    settings.homeFeaturedLabel,
    latestReport?.title ?? "",
    formattedItText,
  ]);
  const reportContentRaw = lang === "it" ? formattedItText : reportContentTranslated;
  const reportContent = formatReportLocal(reportContentRaw);
  const localizedHeroIntro = lang === "en" ? HERO_INTRO_EN : HERO_INTRO_IT;
  const localizedFeaturedLabel =
    lang === "en" &&
    settings.homeFeaturedLabel.trim().toLowerCase() === HOME_FEATURED_LABEL_IT.toLowerCase()
      ? HOME_FEATURED_LABEL_EN
      : featuredLabel;
  const localizedMarketLabel =
    lang === "en" &&
    settings.homeMarketLabel.trim().toLowerCase() === HOME_MARKET_LABEL_IT.toLowerCase()
      ? HOME_MARKET_LABEL_EN
      : marketLabel;
  const [marketOpen, setMarketOpen] = useState(false);
  const [featuredOpen, setFeaturedOpen] = useState(false);
  const [dashboardsOpen, setDashboardsOpen] = useState(false);
  const dashboardsLabel = lang === "en" ? "Interactive Dashboards" : "Dashboard Interattive";
  const dashboardsBadge = lang === "en" ? "Interactive" : "Interattiva";
  const dashboardsOpenLabel = lang === "en" ? "Open dashboard" : "Apri dashboard";
  const routableDashboards = dashboards.filter((d) => dashboardPath(d.component_key));
  const selectedDashboards = settings.featuredDashboardIds
    .map((id) => routableDashboards.find((d) => d.id === id))
    .filter((d): d is (typeof routableDashboards)[number] => Boolean(d));
  const visibleDashboards = (
    selectedDashboards.length > 0 ? selectedDashboards : routableDashboards
  ).slice(0, 3);

  useEffect(() => {
    const channel = supabase
      .channel("home-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "market_reports" }, () => {
        queryClient.invalidateQueries({ queryKey: ["market-reports"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "papers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["papers"] });
      })
      .subscribe();
    // Poll every 30s so scheduled publish_at transitions surface without reload.
    const interval = window.setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["papers"] });
    }, 30_000);
    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(interval);
    };
  }, [queryClient]);

  const { consent } = useConsent();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (consent !== "accepted") return;
    try {
      const KEY = "visitor_token";
      const SESSION_KEY = "visit_recorded_at";
      let token = localStorage.getItem(KEY);
      if (!token) {
        token = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)).replace(/-/g, "");
        localStorage.setItem(KEY, token);
      }
      const last = Number(sessionStorage.getItem(SESSION_KEY) ?? "0");
      // Throttle: max 1 visit per 30 minutes per session
      if (Date.now() - last < 30 * 60 * 1000) return;
      sessionStorage.setItem(SESSION_KEY, String(Date.now()));
      recordSiteVisit({ data: { visitorToken: token, path: "/" } }).catch(() => {});
    } catch {
      /* ignore */
    }
  }, [consent]);

  const featured = settings.featuredPaperIds
    .map((id) => papers.find((p) => p.id === id))
    .filter((p): p is (typeof papers)[number] => Boolean(p));
  // Latest 3 papers in chronological order (newest first), including featured.
  const latest = [...papers]
    .sort((a, b) => (a.publishedDate < b.publishedDate ? 1 : -1))
    .slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <section className="max-w-6xl mx-auto px-6 pt-10 md:pt-16 pb-12 md:pb-16 w-full">
        <div className="animate-fade-up grid md:grid-cols-12 gap-8 md:gap-12 items-start">
          <div className="md:col-span-7">
            {settings.heroVideoUrl ? (
              <div className="relative w-full overflow-hidden border border-border bg-surface aspect-video">
                <video
                  key={settings.heroVideoUrl}
                  src={settings.heroVideoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video w-full border border-dashed border-border bg-surface flex items-center justify-center font-display font-bold uppercase tracking-widest text-foreground text-center px-6">
                {HERO_TITLE_FIXED}
              </div>
            )}
          </div>
          <div className="md:col-span-5 md:pt-2">
            <div className="text-base md:text-lg leading-relaxed text-pretty md:text-justify text-muted-foreground space-y-4 md:border-l md:border-border md:pl-6">
              <p className="whitespace-pre-line">{localizedHeroIntro}</p>
            </div>
            <div className="mt-8 flex flex-nowrap items-stretch gap-2 sm:gap-3 md:pl-6">
              <Link
                to="/archivio"
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-2.5 sm:px-4 py-2 sm:py-2.5 bg-foreground text-background font-display text-[9px] sm:text-[11px] font-bold uppercase tracking-wider hover:bg-primary transition-colors whitespace-nowrap"
              >
                {t("home.ctaReadPapers")}
              </Link>
              {settings.homeMarketEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    setMarketOpen(true);
                    requestAnimationFrame(() =>
                      document
                        .getElementById("market-section")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
                    );
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center px-2.5 sm:px-4 py-2 sm:py-2.5 border border-foreground text-foreground font-display text-[9px] sm:text-[11px] font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors whitespace-nowrap"
                >
                  {t("home.ctaMarkets")}
                </button>
              )}
              <a
                href={settings.linkedinUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="flex-1 sm:flex-none inline-flex items-center justify-center px-2.5 sm:px-4 py-2 sm:py-2.5 border border-border text-foreground font-display text-[9px] sm:text-[11px] font-bold uppercase tracking-wider hover:border-foreground transition-colors whitespace-nowrap"
              >
                {t("home.ctaLinkedin")}
              </a>
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
                <h2 className="text-xl md:text-2xl font-display font-bold tracking-tighter italic group-hover:text-primary leading-tight transition-colors">
                  {localizedFeaturedLabel || t("home.featuredTitle")}
                </h2>
              </div>
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border transition-all group-hover:border-primary group-hover:text-primary shrink-0"
                style={{ transform: featuredOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                aria-hidden
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
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

      {visibleDashboards.length > 0 && (
        <section className="border-t border-border bg-background">
          <div className="max-w-6xl mx-auto px-6">
            <button
              type="button"
              onClick={() => setDashboardsOpen((v) => !v)}
              aria-expanded={dashboardsOpen}
              className="group w-full flex items-center justify-between gap-6 py-7 md:py-9 text-left transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="inline-flex items-center font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-amber-400 text-black shrink-0">
                  {dashboardsBadge}
                </span>
                <h2 className="text-xl md:text-2xl font-display font-bold tracking-tighter italic group-hover:text-primary leading-tight transition-colors">
                  {dashboardsLabel}
                </h2>
              </div>
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border transition-all group-hover:border-primary group-hover:text-primary shrink-0"
                style={{ transform: dashboardsOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                aria-hidden
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </button>
            {dashboardsOpen && (
              <div className="pb-10 md:pb-14 animate-fade-up">
                <div className="grid gap-4 sm:grid-cols-2">
                  {visibleDashboards.map((d) => {
                    const path = dashboardPath(d.component_key)!;
                    const title = lang === "en" && d.title_en ? d.title_en : d.title;
                    const desc =
                      lang === "en" && d.description_en ? d.description_en : d.description;
                    return (
                      <Link
                        key={d.id}
                        to={path}
                        className="group block border border-border bg-surface p-6 hover:border-primary transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center font-mono text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-400 text-black">
                            {dashboardsBadge}
                          </span>
                        </div>
                        <h3 className="font-display text-lg font-bold tracking-tight mb-2 group-hover:text-primary transition-colors">
                          {title}
                        </h3>
                        {desc && (
                          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                            {desc}
                          </p>
                        )}
                        <span className="font-display text-[11px] font-bold uppercase tracking-widest border-b-2 border-foreground pb-0.5 group-hover:text-primary group-hover:border-primary transition-all">
                          {dashboardsOpenLabel} →
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}



      {settings.homeMarketEnabled && (
        <section id="market-section" className="border-t border-border bg-background scroll-mt-20">
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
                <h2 className="text-xl md:text-2xl font-display font-bold tracking-tighter italic group-hover:text-primary leading-tight transition-colors">
                  {localizedMarketLabel}
                </h2>
              </div>
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border transition-all group-hover:border-primary group-hover:text-primary shrink-0"
                style={{ transform: marketOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                aria-hidden
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </button>
            {marketOpen && (
              <div className="pb-10 md:pb-14 animate-fade-up">
                {latestReport ? (
                  <article className="border border-border bg-surface p-6 md:p-8">
                    <div className="flex flex-wrap items-baseline gap-3 mb-4">
                      <h3 className="font-display text-xl font-bold tracking-tight">
                        {reportTitle}
                      </h3>
                      <time className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                        {new Date(latestReport.reportDate).toLocaleDateString(dateLocale, {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                    {settings.homeMarketImageUrl && (
                      <div className="mb-6 -mx-6 md:-mx-8 border-y border-border bg-background">
                        <img
                          src={settings.homeMarketImageUrl}
                          alt=""
                          className="block w-full max-h-72 md:max-h-96 object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}
                    <div className="market-report-prose text-foreground">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{reportContent}</ReactMarkdown>
                    </div>
                    <div className="mt-6">
                      <Link
                        to="/archivio"
                        className="font-display text-xs font-bold uppercase tracking-widest border-b-2 border-foreground pb-0.5 hover:text-primary hover:border-primary transition-all"
                      >
                        {t("home.reportArchive")}
                      </Link>
                    </div>
                  </article>
                ) : (
                  <div className="border border-border p-10 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground bg-surface">
                    {t("home.noReport")}
                  </div>
                )}
                {marketDisclaimer && marketDisclaimer.trim() && (
                  <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {marketDisclaimer}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <FinancialNewsSection />

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
