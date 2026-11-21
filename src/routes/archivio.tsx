import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PaperRow } from "@/components/PaperRow";
import { listPublishedPapers } from "@/lib/papers.functions";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useTranslated } from "@/hooks/use-translated";
import { useDashboardLabels } from "@/hooks/use-dashboard-labels";
import { Link } from "@tanstack/react-router";
import { listPublishedDashboards } from "@/lib/dashboards.functions";
import { dashboardPath } from "@/lib/dashboard-registry";
import { ogImageMeta } from "@/lib/og";

const archiveSearchSchema = z.object({
  tab: z.enum(["papers", "dashboards"]).optional().catch("papers"),
  tag: z.string().max(80).optional().catch(undefined),
});

const papersQuery = {
  queryKey: ["papers", "published"] as const,
  queryFn: () => listPublishedPapers(),
};

const dashboardsQuery = {
  queryKey: ["dashboards", "published"] as const,
  queryFn: () => listPublishedDashboards(),
  staleTime: 60_000,
};

export const Route = createFileRoute("/archivio")({
  validateSearch: archiveSearchSchema,
  head: () => ({
    meta: [
      { title: "Archivio paper e dashboard interattive — Andrea Muti" },
      {
        name: "description",
        content:
          "Archivio completo dei paper di ricerca e delle dashboard interattive di Andrea Muti sui mercati finanziari.",
      },
      { property: "og:title", content: "Archivio paper e dashboard interattive — Andrea Muti" },
      {
        property: "og:description",
        content: "Paper di ricerca e dashboard interattive sui mercati finanziari.",
      },
      { property: "og:url", content: "https://www.andreamuti.com/archivio" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Archivio paper e dashboard interattive — Andrea Muti" },
      {
        name: "twitter:description",
        content: "Paper di ricerca e dashboard interattive sui mercati finanziari.",
      },
      ...ogImageMeta(),
    ],
    links: [{ rel: "canonical", href: "https://www.andreamuti.com/archivio" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(papersQuery),
  component: Archivio,
});

type SortKey = "relevance" | "recent" | "oldest" | "title";
const PAGE_SIZE = 8;

function relevanceScore(
  p: { title: string; abstract: string; content: string; tags: string[] },
  q: string,
) {
  if (!q) return 0;
  const inc = (s: string) => s.toLowerCase().includes(q);
  let score = 0;
  if (inc(p.title)) score += 10;
  if (p.tags.some((t) => inc(t))) score += 6;
  if (inc(p.abstract)) score += 4;
  const body = p.content.toLowerCase();
  let idx = body.indexOf(q);
  let hits = 0;
  while (idx !== -1 && hits < 20) {
    hits += 1;
    idx = body.indexOf(q, idx + q.length);
  }
  return score + hits;
}
type TabKey = "papers" | "dashboards";

function Archivio() {
  const { data: papers } = useSuspenseQuery(papersQuery);
  const queryClient = useQueryClient();
  const t = useT();
  const settings = useSiteSettings();
  const { data: dashboards = [] } = useQuery(dashboardsQuery);
  const search = useSearch({ from: "/archivio" });
  const [tab, setTab] = useState<TabKey>(search.tab ?? "papers");
  const archiveDashboards = dashboards.filter((d) => dashboardPath(d.component_key));
  const archiveDashboardLabels = useDashboardLabels(archiveDashboards);
  const [archiveDisclaimer] = useTranslated([settings.archiveDisclaimer]);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string>(search.tag ?? "");
  const [year, setYear] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("recent");

  useEffect(() => {
    const channel = supabase
      .channel("archive-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "papers" }, () => {
        queryClient.invalidateQueries({ queryKey: ["papers"] });
      })
      .subscribe();
    const interval = window.setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["papers"] });
    }, 30_000);
    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(interval);
    };
  }, [queryClient]);

  const allTags = useMemo(
    () => Array.from(new Set(papers.flatMap((p) => p.tags))).sort(),
    [papers],
  );

  const allYears = useMemo(
    () =>
      Array.from(new Set(papers.map((p) => new Date(p.publishedDate).getFullYear()))).sort(
        (a, b) => b - a,
      ),
    [papers],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = papers.filter((p) => {
      if (tag && !p.tags.includes(tag)) return false;
      if (year && String(new Date(p.publishedDate).getFullYear()) !== year) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.abstract.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tags.some((tg) => tg.toLowerCase().includes(q))
      );
    });

    const sorted = [...result];
    switch (sort) {
      case "relevance":
        if (q) {
          sorted.sort(
            (a, b) =>
              relevanceScore(b, q) - relevanceScore(a, q) ||
              +new Date(b.publishedDate) - +new Date(a.publishedDate),
          );
        } else {
          sorted.sort((a, b) => +new Date(b.publishedDate) - +new Date(a.publishedDate));
        }
        break;
      case "recent":
        sorted.sort((a, b) => +new Date(b.publishedDate) - +new Date(a.publishedDate));
        break;
      case "oldest":
        sorted.sort((a, b) => +new Date(a.publishedDate) - +new Date(b.publishedDate));
        break;
      case "title":
        sorted.sort((a, b) => a.title.localeCompare(b.title, "it"));
        break;
    }
    return sorted;
  }, [papers, query, tag, year, sort]);

  const [visible, setVisible] = useState(PAGE_SIZE);
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, tag, year, sort, tab]);
  const shown = filtered.slice(0, visible);

  const resetFilters = () => {
    setQuery("");
    setTag("");
    setYear("");
    setSort("recent");
  };

  const hasFilters = query || tag || year || sort !== "recent";

  const SPARKS = [
    "M4 44 L24 36 L44 40 L64 24 L84 28 L104 12 L116 16",
    "M4 40 L24 42 L44 30 L64 34 L84 18 L104 20 L116 8",
    "M4 48 L30 44 L56 38 L82 28 L104 16 L116 6",
    "M4 20 L24 28 L44 22 L64 36 L84 30 L104 42 L116 38",
  ];
  const chip = (active: boolean) =>
    `am-btn h-10 px-4 rounded-full border text-sm font-medium font-display ${
      active
        ? "bg-brand text-brand-fg border-brand dark:bg-primary dark:text-primary-foreground dark:border-primary"
        : "bg-background text-foreground border-border hover:border-foreground"
    }`;
  const selectCls =
    "h-10 bg-background border border-border rounded-md px-3 text-sm font-display focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <section className="bg-brand text-brand-fg">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8 pt-10 pb-9">
          <h1 className="am-in font-editorial font-medium text-4xl sm:text-[40px] leading-tight">
            {t("nav.archive")}
          </h1>
          <p className="am-in am-d1 mt-3 text-[15.5px] text-brand-muted font-display">
            {t("archive.introBoth", papers.length, archiveDashboards.length)}
          </p>
          <div
            role="tablist"
            aria-label={t("nav.archive")}
            className="am-in am-d2 inline-flex gap-1 mt-7 p-1 rounded-[10px] bg-brand-2 font-display"
          >
            {(
              [
                ["papers", `${t("archive.tab.papers")} · ${papers.length}`],
                ["dashboards", `${t("archive.tab.dashboards")} · ${archiveDashboards.length}`],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`am-btn h-11 px-4 sm:px-5 rounded-lg text-sm sm:text-[15px] font-semibold ${
                  tab === key
                    ? "bg-background text-foreground"
                    : "text-brand-fg hover:bg-brand-line"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === "papers" && (
            <div className="am-in am-d3 mt-7 max-w-[760px] flex items-center gap-3 h-12 px-4 rounded-lg bg-background text-foreground">
              <svg
                aria-hidden="true"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
              <label htmlFor="archive-search" className="sr-only">
                {t("archive.searchPlaceholder")}
              </label>
              <input
                id="archive-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("archive.searchPlaceholder")}
                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[15.5px] font-display"
              />
            </div>
          )}
        </div>
      </section>

      <section className="max-w-[1240px] w-full mx-auto px-6 sm:px-8 pt-6 pb-14">
        {tab === "papers" ? (
          <>
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={!tag}
                  onClick={() => setTag("")}
                  className={chip(!tag)}
                >
                  {t("archive.allTopics")}
                </button>
                {allTags.map((tg) => (
                  <button
                    key={tg}
                    type="button"
                    aria-pressed={tag === tg}
                    onClick={() => setTag(tg)}
                    className={chip(tag === tg)}
                  >
                    {tg}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label={t("archive.allYears")}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className={selectCls}
                >
                  <option value="">{t("archive.allYears")}</option>
                  {allYears.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={t("archive.sort.recent")}
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className={selectCls}
                >
                  <option value="relevance">{t("archive.sort.relevance")}</option>
                  <option value="recent">{t("archive.sort.recent")}</option>
                  <option value="oldest">{t("archive.sort.oldest")}</option>
                  <option value="title">{t("archive.sort.title")}</option>
                </select>
                {hasFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="am-btn h-10 px-3 text-sm text-muted-foreground hover:text-foreground font-display"
                  >
                    {t("archive.reset")}
                  </button>
                )}
              </div>
            </div>

            <p className="mt-5 text-sm text-muted-foreground font-display">
              {t("archive.results", filtered.length)}
            </p>

            {filtered.length === 0 ? (
              <div className="mt-6 rounded-xl border border-border p-12 text-center text-muted-foreground font-display">
                {t("archive.empty")}
              </div>
            ) : (
              <>
                <div key={`${tag}|${year}|${sort}`} className="am-list">
                  {shown.map((p) => (
                    <PaperRow key={p.id} paper={p} />
                  ))}
                </div>
                {visible < filtered.length && (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                      className="am-btn h-12 px-6 rounded-md border border-brand text-brand dark:border-primary dark:text-primary font-semibold text-[15px] font-display"
                    >
                      {t("archive.loadMore")} ({filtered.length - visible})
                    </button>
                  </div>
                )}
              </>
            )}
            {archiveDisclaimer && archiveDisclaimer.trim() && (
              <p className="mt-8 text-xs text-muted-foreground font-display">{archiveDisclaimer}</p>
            )}
          </>
        ) : archiveDashboards.length === 0 ? (
          <div className="rounded-xl border border-border p-12 text-center text-muted-foreground font-display">
            {t("archive.noDashboards")}
          </div>
        ) : (
          <div className="am-list grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
            {archiveDashboards.map((d, di) => {
              const path = dashboardPath(d.component_key)!;
              const title = archiveDashboardLabels[di]?.title ?? d.title;
              const desc = archiveDashboardLabels[di]?.description ?? d.description;
              return (
                <Link
                  key={d.id}
                  to={path}
                  className="am-lift am-card flex flex-col rounded-2xl border border-sage-line overflow-hidden bg-background text-foreground"
                >
                  <span className="h-[120px] bg-sage flex items-center justify-center overflow-hidden">
                    <svg
                      className="am-img"
                      aria-hidden="true"
                      width="120"
                      height="56"
                      viewBox="0 0 120 56"
                      fill="none"
                    >
                      <path
                        d={SPARKS[di % SPARKS.length]}
                        stroke="var(--primary)"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span className="p-5 pb-6 font-display">
                    <span className="block font-editorial text-[18px] font-medium leading-snug">
                      {title}
                    </span>
                    {desc && (
                      <span className="block mt-2 text-[15px] leading-relaxed text-muted-foreground">
                        {desc}
                      </span>
                    )}
                    <span className="block mt-3.5 text-sm font-semibold text-primary">
                      {t("dashboard.open")} <span className="am-arrow">→</span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex-1" />
      <SiteFooter />
    </div>
  );
}
