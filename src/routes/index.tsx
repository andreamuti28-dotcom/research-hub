import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import portrait from "@/assets/portrait.jpg";
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
import { useTranslated, useTranslatedLive } from "@/hooks/use-translated";
import { useDashboardLabels } from "@/hooks/use-dashboard-labels";
import { useServerFn } from "@tanstack/react-start";
import { formatMarketReportLayout } from "@/lib/format-layout.functions";
import { formatReportLocal } from "@/lib/format-report-local";
import { useLanguage } from "@/hooks/use-language";
import { useConsent } from "@/hooks/use-consent";
import { MarketReportCard } from "@/components/MarketReportCard";
import { InterestMini } from "@/components/InterestMini";
import { useCountUp } from "@/hooks/use-motion";
import { formatDate } from "@/data/papers";
import { tagSlug } from "@/lib/paper-tags";
import { ogImageMeta } from "@/lib/og";

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
      { title: "Andrea Muti ricercatore indipendente in finanza" },
      {
        name: "description",
        content:
          "Paper, dashboard interattive e report giornalieri sui mercati finanziari: risk management, derivati, crypto e macroeconomia.",
      },
      {
        property: "og:title",
        content: "Andrea Muti ricercatore indipendente in finanza",
      },
      {
        property: "og:description",
        content:
          "Paper, dashboard interattive e report giornalieri sui mercati finanziari: risk management, derivati, crypto e macroeconomia.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.andreamuti.com/" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "Andrea Muti ricercatore indipendente in finanza",
      },
      {
        name: "twitter:description",
        content:
          "Paper, dashboard interattive e report giornalieri sui mercati finanziari: risk management, derivati, crypto e macroeconomia.",
      },
      ...ogImageMeta(),
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
  const dateLocale = t("common.monthLocale");

  // Market report: format the raw Italian Google Doc into markdown first, then
  // translate it for the other languages (same pipeline as before).
  const formatFn = useServerFn(formatMarketReportLayout);
  const rawContent = latestReport?.content ?? "";
  const { data: formattedIt } = useQuery({
    queryKey: ["market-report-format-it", latestReport?.id ?? "none"],
    queryFn: () => formatFn({ data: { reportId: latestReport!.id } }),
    enabled: rawContent.trim().length > 0,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const formattedItText = formattedIt?.text ?? rawContent;
  const [marketDisclaimer, heroKicker, heroTagline, heroBio] = useTranslated([
    settings.homeMarketDisclaimer,
    settings.heroKicker,
    settings.heroTitle,
    settings.heroIntro,
  ]);
  const [reportContentTranslated] = useTranslatedLive([formattedItText]);
  const reportContent = formatReportLocal(
    lang === "it" ? formattedItText : reportContentTranslated,
  );
  const reportDate = latestReport
    ? new Date(latestReport.reportDate).toLocaleDateString(dateLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  // Dashboards: the mini compound-interest widget plus a short list.
  const routableDashboards = dashboards.filter((d) => dashboardPath(d.component_key));
  const featuredDashboards = settings.featuredDashboardIds
    .map((id) => routableDashboards.find((d) => d.id === id))
    .filter((d): d is (typeof routableDashboards)[number] => Boolean(d));
  const listDashboards = [
    ...featuredDashboards,
    ...routableDashboards.filter((d) => !featuredDashboards.includes(d)),
  ]
    .filter((d) => d.component_key !== "interesse-composto")
    .slice(0, 5);
  const listDashboardLabels = useDashboardLabels(listDashboards);
  const interestPath = dashboardPath("interesse-composto");

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

  // Papers: newest first (the server already sorts by effective date).
  const latestPaper = papers[0];
  const recentPapers = papers.slice(1, 6);
  const [latestTitle, latestAbstract] = useTranslated([
    latestPaper?.title ?? "",
    latestPaper?.abstract ?? "",
  ]);
  const paperCount = useCountUp(papers.length);

  // Topics: every tag in use, most frequent first.
  const topics = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of papers) for (const tag of p.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [papers]);
  const topicDesc = (tag: string) => {
    const key = `topic.${tagSlug(tag)}`;
    const value = (t as unknown as (k: string) => string | undefined)(key);
    return typeof value === "string" ? value : "";
  };

  const portraitSrc = settings.portraitUrl ?? portrait;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      {/* ---------- Hero: profile ---------- */}
      <section className="bg-brand text-brand-fg">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8 pt-14 pb-16 md:pt-[72px] md:pb-[88px] flex flex-wrap gap-10 md:gap-16 items-center">
          <div className="flex-[0_1_380px] min-w-[240px] am-fadein am-d1">
            <img
              src={portraitSrc}
              alt={t("about.portraitAlt", settings.name)}
              className="w-full aspect-[4/5] object-cover rounded-2xl border border-brand-line bg-brand-2"
              style={{
                objectPosition: `${settings.aboutPortraitPosX}% ${settings.aboutPortraitPosY}%`,
              }}
            />
          </div>
          <div className="flex-[999_1_520px] min-w-0">
            {heroKicker && (
              <p className="am-in text-[13px] font-semibold uppercase tracking-[0.1em] text-gold font-display">
                {heroKicker}
              </p>
            )}
            <h1 className="am-in am-d1 mt-4 font-editorial font-medium text-6xl sm:text-7xl lg:text-[84px] leading-none tracking-[-0.015em]">
              {settings.name}
            </h1>
            <p className="am-in am-d2 mt-5 font-editorial italic text-2xl sm:text-[26px] leading-snug text-[#e6eeea] max-w-[640px]">
              {heroTagline}
            </p>
            <p className="am-in am-d3 mt-5 text-[17px] leading-relaxed text-brand-muted max-w-[620px] font-display">
              {heroBio}
            </p>
            <div className="am-in am-d4 flex flex-wrap gap-3 mt-8 font-display">
              <Link
                to="/archivio"
                className="am-btn inline-flex items-center h-[50px] px-6 rounded-md bg-gold text-[#14171c] font-bold text-[15px]"
              >
                {t("home.hero.cta")}
              </Link>
              {settings.linkedinUrl && (
                <a
                  href={settings.linkedinUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="am-btn inline-flex items-center h-[50px] px-6 rounded-md border border-[#7fa494] text-brand-fg font-semibold text-[15px] hover:border-brand-fg"
                >
                  {t("common.linkedin")}
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-brand-line">
          <div className="am-in am-d5 max-w-[1240px] mx-auto px-6 sm:px-8 grid grid-cols-1 sm:grid-cols-3">
            <div className="py-7 sm:pr-6 border-b sm:border-b-0 sm:border-r border-brand-line">
              <p className="font-editorial text-[40px] font-medium leading-none tabular-nums">
                {paperCount}
              </p>
              <p className="mt-2 text-sm text-brand-muted font-display">{t("home.cred.papers")}</p>
            </div>
            <a
              href={settings.forbesUrl || undefined}
              target={settings.forbesUrl ? "_blank" : undefined}
              rel="noreferrer noopener"
              className="group py-7 sm:px-6 border-b sm:border-b-0 sm:border-r border-brand-line"
            >
              <p className="font-editorial text-[22px] font-medium leading-tight whitespace-pre-line group-hover:text-gold transition-colors">
                {t("home.cred.forbesTitle")}
              </p>
              <p className="mt-1.5 text-sm text-brand-muted font-display">
                {t("home.cred.forbes")}
              </p>
            </a>
            <div className="py-7 sm:pl-6">
              <p className="font-editorial text-[22px] font-medium leading-tight whitespace-pre-line">
                {t("home.cred.clubTitle")}
              </p>
              <p className="mt-1.5 text-sm text-brand-muted font-display">{t("home.cred.club")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Latest paper + daily market report ---------- */}
      <section className="max-w-[1240px] w-full mx-auto px-6 sm:px-8 pt-20 pb-10 flex flex-wrap gap-8">
        {latestPaper && (
          <Link
            to="/paper/$slug"
            params={{ slug: latestPaper.slug }}
            className="am-reveal group flex-[999_1_560px] min-w-0 block border-t-[3px] border-primary pt-6 text-foreground"
          >
            <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-primary font-display">
              {t("home.latest.kicker", formatDate(latestPaper.publishedDate, lang))}
            </p>
            <h2 className="mt-3.5 font-editorial font-medium text-4xl md:text-[40px] leading-[1.15] group-hover:text-primary transition-colors">
              {latestTitle}
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground max-w-[680px] font-display line-clamp-4">
              {latestAbstract}
            </p>
            <p className="mt-5 text-[15px] text-muted-foreground font-display">
              {latestPaper.tags.join(" · ")} ·{" "}
              <span className="font-semibold text-primary">
                {t("paper.readOnline")} <span className="am-arrow">→</span>
              </span>
            </p>
          </Link>
        )}
        {settings.homeMarketEnabled && latestReport && (
          <MarketReportCard
            className="am-reveal flex-[1_1_380px] min-w-0"
            date={reportDate}
            content={reportContent}
            disclaimer={marketDisclaimer}
          />
        )}
      </section>

      {/* ---------- Topics ---------- */}
      {topics.length > 0 && (
        <section className="max-w-[1240px] w-full mx-auto px-6 sm:px-8 pt-14 pb-10">
          <h2 className="am-reveal font-editorial font-medium text-[40px] leading-tight">
            {t("home.themes.title")}
          </h2>
          <div className="am-stagger grid gap-5 mt-7 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
            {topics.map(([tag, count]) => (
              <Link
                key={tag}
                to="/archivio"
                search={{ tag }}
                className="am-lift block p-6 rounded-xl border border-sage-line bg-background text-foreground"
              >
                <h3 className="font-display text-lg font-bold">{tag}</h3>
                {topicDesc(tag) && (
                  <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground font-display">
                    {topicDesc(tag)}
                  </p>
                )}
                <p className="mt-3 text-sm font-semibold text-primary font-display">
                  {t("home.themes.count", count)} <span className="am-arrow">→</span>
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ---------- Interactive dashboards ---------- */}
      {routableDashboards.length > 0 && (
        <section className="bg-brand text-brand-fg mt-10">
          <div className="max-w-[1240px] mx-auto px-6 sm:px-8 py-20">
            <div className="flex flex-wrap justify-between items-end gap-6">
              <div className="am-reveal">
                <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-gold font-display">
                  {t("home.dash.kicker", routableDashboards.length)}
                </p>
                <h2 className="mt-3 font-editorial font-medium text-5xl leading-[1.1]">
                  {t("home.dash.title")}
                </h2>
                <p className="mt-3.5 text-[17px] leading-relaxed text-brand-muted max-w-[620px] font-display">
                  {t("home.dash.intro")}
                </p>
              </div>
              <Link
                to="/archivio"
                search={{ tab: "dashboards" }}
                className="am-btn inline-flex items-center h-12 px-6 rounded-md border border-[#7fa494] text-brand-fg font-semibold text-[15px] font-display hover:border-brand-fg"
              >
                {t("home.dash.all")}&nbsp;<span className="am-arrow">→</span>
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 mt-10">
              <div className="am-reveal flex-[999_1_560px] min-w-0">
                <InterestMini href={interestPath} />
              </div>
              <div className="am-stagger flex-[1_1_360px] min-w-0 flex flex-col gap-3">
                {listDashboards.map((d, i) => (
                  <Link
                    key={d.id}
                    to={dashboardPath(d.component_key)!}
                    className="am-lift flex gap-4 items-center p-5 rounded-xl border border-brand-line text-brand-fg hover:bg-brand-2"
                  >
                    <span className="shrink-0 w-11 h-11 rounded-[10px] bg-brand-2 flex items-center justify-center">
                      <svg
                        aria-hidden="true"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--gold)"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M3 20h18" />
                        <path d="M6 16v-4" />
                        <path d="M11 16V8" />
                        <path d="M16 16v-6" />
                        <path d="M20 16V5" />
                      </svg>
                    </span>
                    <span className="min-w-0 font-display">
                      <span className="block text-base font-semibold">
                        {listDashboardLabels[i]?.title ?? d.title}
                      </span>
                      {(listDashboardLabels[i]?.description ?? d.description) && (
                        <span className="block mt-0.5 text-sm leading-snug text-brand-muted line-clamp-2">
                          {listDashboardLabels[i]?.description ?? d.description}
                        </span>
                      )}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ---------- Recent research ---------- */}
      {recentPapers.length > 0 && (
        <section className="max-w-[1240px] w-full mx-auto px-6 sm:px-8 pt-16 pb-16">
          <div className="flex flex-wrap justify-between items-baseline gap-6">
            <h2 className="am-reveal font-editorial font-medium text-[40px] leading-tight">
              {t("home.recent.title")}
            </h2>
            <Link
              to="/archivio"
              className="text-[15px] font-semibold text-primary font-display hover:underline underline-offset-4"
            >
              {t("home.recent.all", papers.length)} <span className="am-arrow">→</span>
            </Link>
          </div>
          <div className="am-stagger mt-2">
            {recentPapers.map((p) => (
              <PaperRow key={p.id} paper={p} />
            ))}
          </div>
        </section>
      )}

      {/* ---------- Path to the About page ---------- */}
      <section className="bg-sage">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8 py-14 flex justify-center">
          <Link
            to="/about"
            className="am-btn inline-flex items-center h-14 px-8 rounded-md bg-brand text-brand-fg font-bold text-base font-display"
          >
            {t("home.path.cta")}&nbsp;<span className="am-arrow">→</span>
          </Link>
        </div>
      </section>

      <div className="flex-1" />
      <SiteFooter />
    </div>
  );
}
