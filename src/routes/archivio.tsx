import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PaperRow } from "@/components/PaperRow";
import { listPublishedPapers } from "@/lib/papers.functions";
import { listArchivedMarketReports } from "@/lib/market-reports.functions";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useTranslated } from "@/hooks/use-translated";

const papersQuery = {
  queryKey: ["papers", "published"] as const,
  queryFn: () => listPublishedPapers(),
};

const marketReportsQuery = {
  queryKey: ["market-reports", "archive"] as const,
  queryFn: () => listArchivedMarketReports(),
};

export const Route = createFileRoute("/archivio")({
  head: () => ({
    meta: [
      { title: "Archivio — Andrea Muti" },
      {
        name: "description",
        content:
          "Archivio completo dei paper di ricerca e dei report dei mercati finanziari.",
      },
      { property: "og:title", content: "Archivio — Andrea Muti" },
      {
        property: "og:description",
        content: "Paper di ricerca e report dei mercati finanziari.",
      },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(papersQuery),
      context.queryClient.ensureQueryData(marketReportsQuery),
    ]),
  component: Archivio,
});

type SortKey = "recent" | "oldest" | "title";
type Tab = "papers" | "market";

function Archivio() {
  const { data: papers } = useSuspenseQuery(papersQuery);
  const { data: marketReports } = useSuspenseQuery(marketReportsQuery);
  const queryClient = useQueryClient();
  const t = useT();
  const settings = useSiteSettings();
  const [archiveDisclaimer] = useTranslated([settings.archiveDisclaimer]);
  const [tab, setTab] = useState<Tab>("papers");
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [mrQuery, setMrQuery] = useState("");
  const [mrDate, setMrDate] = useState("");

  useEffect(() => {
    const channel = supabase
      .channel("market-reports-archive")
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

  const allTags = useMemo(
    () => Array.from(new Set(papers.flatMap((p) => p.tags))).sort(),
    [papers],
  );

  const allYears = useMemo(
    () =>
      Array.from(
        new Set(papers.map((p) => new Date(p.publishedDate).getFullYear())),
      ).sort((a, b) => b - a),
    [papers],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result = papers.filter((p) => {
      if (tag && !p.tags.includes(tag)) return false;
      if (year && String(new Date(p.publishedDate).getFullYear()) !== year)
        return false;
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
      case "recent":
        sorted.sort(
          (a, b) => +new Date(b.publishedDate) - +new Date(a.publishedDate),
        );
        break;
      case "oldest":
        sorted.sort(
          (a, b) => +new Date(a.publishedDate) - +new Date(b.publishedDate),
        );
        break;
      case "title":
        sorted.sort((a, b) => a.title.localeCompare(b.title, "it"));
        break;
    }
    return sorted;
  }, [papers, query, tag, year, sort]);

  const filteredMr = useMemo(() => {
    const q = mrQuery.trim().toLowerCase();
    return marketReports.filter((r) => {
      if (mrDate && r.reportDate !== mrDate) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.content.toLowerCase().includes(q) ||
        (r.source ?? "").toLowerCase().includes(q) ||
        r.reportDate.includes(q)
      );
    });
  }, [marketReports, mrQuery, mrDate]);

  const resetFilters = () => {
    setQuery("");
    setTag("");
    setYear("");
    setSort("recent");
  };

  const hasFilters = query || tag || year || sort !== "recent";

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <section className="max-w-6xl mx-auto px-6 py-16 md:py-24 w-full">
        <div className="mb-10 md:mb-12 animate-fade-up">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            {t("archive.kicker")}
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tighter italic mb-3">
            {t("archive.title")}
          </h1>
          {archiveDisclaimer && archiveDisclaimer.trim() && (
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {archiveDisclaimer}
            </p>
          )}
        </div>

        <div className="flex gap-2 mb-8 border-b border-border">
          <TabBtn active={tab === "papers"} onClick={() => setTab("papers")}>
            Paper
          </TabBtn>
          <TabBtn active={tab === "market"} onClick={() => setTab("market")}>
            Report dei mercati finanziari
          </TabBtn>
        </div>

        {tab === "papers" ? (
          <>
            <p className="max-w-[55ch] text-base text-muted-foreground leading-relaxed text-justify mb-6">
              {t("archive.intro", papers.length)}
            </p>
            <div className="flex flex-col gap-3 mb-6">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("archive.searchPlaceholder")}
                className="bg-background border border-border px-4 py-2.5 text-sm font-display focus:outline-none focus:ring-1 focus:ring-primary w-full"
              />
              <div className="flex flex-wrap gap-3">
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="bg-background border border-border px-3 py-2 text-xs font-display focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">{t("archive.allTags")}</option>
                  {allTags.map((tg) => (
                    <option key={tg} value={tg}>
                      #{tg}
                    </option>
                  ))}
                </select>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="bg-background border border-border px-3 py-2 text-xs font-display focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">{t("archive.allYears")}</option>
                  {allYears.map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="bg-background border border-border px-3 py-2 text-xs font-display focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="recent">{t("archive.sort.recent")}</option>
                  <option value="oldest">{t("archive.sort.oldest")}</option>
                  <option value="title">{t("archive.sort.title")}</option>
                </select>
                {hasFilters && (
                  <button
                    onClick={resetFilters}
                    className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-colors"
                  >
                    {t("archive.reset")}
                  </button>
                )}
              </div>
            </div>

            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
              {t("archive.results", filtered.length)}
            </div>

            {filtered.length === 0 ? (
              <div className="border border-border p-12 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
                {t("archive.empty")}
              </div>
            ) : (
              <div className="space-y-px bg-border border border-border">
                {filtered.map((p) => (
                  <PaperRow key={p.id} paper={p} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <p className="max-w-[60ch] text-base text-muted-foreground leading-relaxed text-justify mb-6">
              Archivio dei report sui mercati finanziari ricevuti dal sistema automatico.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                value={mrQuery}
                onChange={(e) => setMrQuery(e.target.value)}
                placeholder="Cerca per titolo, contenuto o data…"
                className="bg-background border border-border px-4 py-2.5 text-sm font-display focus:outline-none focus:ring-1 focus:ring-primary flex-1"
              />
              <input
                type="date"
                value={mrDate}
                onChange={(e) => setMrDate(e.target.value)}
                className="bg-background border border-border px-3 py-2.5 text-sm font-display focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {(mrQuery || mrDate) && (
                <button
                  onClick={() => {
                    setMrQuery("");
                    setMrDate("");
                  }}
                  className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground border border-border transition-colors"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
              {filteredMr.length} {filteredMr.length === 1 ? "report" : "report"}
            </div>

            {filteredMr.length === 0 ? (
              <div className="border border-border p-12 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
                Nessun report trovato.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMr.map((r) => (
                  <MarketReportCard key={r.id} report={r} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <div className="flex-1" />
      <SiteFooter />
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-3 font-display text-xs font-bold uppercase tracking-widest border-b-2 -mb-px transition-colors ${
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function MarketReportCard({
  report,
}: {
  report: {
    id: string;
    title: string;
    content: string;
    reportDate: string;
    source: string | null;
    isCurrent: boolean;
  };
}) {
  const [open, setOpen] = useState(false);
  return (
    <article className="border border-border bg-background">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-surface transition-colors"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-3 mb-1">
            <h3 className="font-display text-base md:text-lg font-bold tracking-tight truncate">
              {report.title}
            </h3>
            {report.isCurrent && (
              <span className="font-mono text-[9px] uppercase tracking-widest bg-primary text-primary-foreground px-1.5 py-0.5">
                Live
              </span>
            )}
          </div>
          <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {new Date(report.reportDate).toLocaleDateString("it-IT", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            {report.source && <span> · {report.source}</span>}
          </div>
        </div>
        <span
          className="font-display text-xl font-bold shrink-0 transition-transform"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
          aria-hidden
        >
          +
        </span>
      </button>
      {open && (
        <div className="px-5 pb-5 whitespace-pre-line leading-relaxed text-sm md:text-base text-pretty text-justify">
          {report.content}
        </div>
      )}
    </article>
  );
}
