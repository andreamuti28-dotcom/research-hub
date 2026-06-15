import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PaperRow } from "@/components/PaperRow";
import { listPublishedPapers } from "@/lib/papers.functions";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/lib/i18n";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useTranslated } from "@/hooks/use-translated";

const papersQuery = {
  queryKey: ["papers", "published"] as const,
  queryFn: () => listPublishedPapers(),
};

export const Route = createFileRoute("/archivio")({
  head: () => ({
    meta: [
      { title: "Archivio paper e report finanziari — Andrea Muti" },
      {
        name: "description",
        content:
          "Archivio completo dei paper di ricerca di Andrea Muti e dei report giornalieri sui mercati finanziari.",
      },
      { property: "og:title", content: "Archivio paper e report finanziari — Andrea Muti" },
      {
        property: "og:description",
        content: "Paper di ricerca e report dei mercati finanziari.",
      },
      { property: "og:url", content: "https://www.andreamuti.com/archivio" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Archivio paper e report finanziari — Andrea Muti" },
      {
        name: "twitter:description",
        content: "Paper di ricerca e report dei mercati finanziari.",
      },
    ],
    links: [{ rel: "canonical", href: "https://www.andreamuti.com/archivio" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(papersQuery),
  component: Archivio,
});

type SortKey = "recent" | "oldest" | "title";

function Archivio() {
  const { data: papers } = useSuspenseQuery(papersQuery);
  const queryClient = useQueryClient();
  const t = useT();
  const settings = useSiteSettings();
  const [archiveDisclaimer] = useTranslated([settings.archiveDisclaimer]);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("recent");

  useEffect(() => {
    const channel = supabase
      .channel("archive-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "papers" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["papers"] });
        },
      )
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
      </section>

      <div className="flex-1" />
      <SiteFooter />
    </div>
  );
}
