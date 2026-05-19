import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PaperRow } from "@/components/PaperRow";
import { listPublishedPapers } from "@/lib/papers.functions";

const papersQuery = {
  queryKey: ["papers", "published"] as const,
  queryFn: () => listPublishedPapers(),
};

export const Route = createFileRoute("/archivio")({
  head: () => ({
    meta: [
      { title: "Archivio — Andrea Muti" },
      {
        name: "description",
        content:
          "Archivio completo dei paper di ricerca pubblicati. Filtra per categoria o cerca per parola chiave.",
      },
      { property: "og:title", content: "Archivio — Andrea Muti" },
      {
        property: "og:description",
        content: "Tutti i paper di ricerca pubblicati.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(papersQuery),
  component: Archivio,
});

type SortKey = "recent" | "oldest" | "views" | "title";

function Archivio() {
  const { data: papers } = useSuspenseQuery(papersQuery);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [sort, setSort] = useState<SortKey>("recent");

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
        p.tags.some((t) => t.toLowerCase().includes(q))
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
      case "views":
        sorted.sort((a, b) => b.views - a.views);
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
        <div className="mb-12 md:mb-16 animate-fade-up">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
            Archivio completo
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tighter italic mb-6">
            Ricerca Pubblicata
          </h1>
          <p className="max-w-[55ch] text-lg text-muted-foreground leading-relaxed">
            {papers.length} paper indicizzati. Cerca nel testo completo, filtra
            per tag o anno e ordina per rilevanza.
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per titolo, abstract, contenuto o tag…"
            className="bg-background border border-border px-4 py-2.5 text-sm font-display focus:outline-none focus:ring-1 focus:ring-primary w-full"
          />
          <div className="flex flex-wrap gap-3">
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="bg-background border border-border px-3 py-2 text-xs font-display focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Tutti i tag</option>
              {allTags.map((t) => (
                <option key={t} value={t}>
                  #{t}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-background border border-border px-3 py-2 text-xs font-display focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Tutti gli anni</option>
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
              <option value="recent">Più recenti</option>
              <option value="oldest">Più vecchi</option>
              <option value="views">Più visti</option>
              <option value="title">Titolo (A→Z)</option>
            </select>
            {hasFilters && (
              <button
                onClick={resetFilters}
                className="px-3 py-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          {filtered.length} {filtered.length === 1 ? "risultato" : "risultati"}
        </div>

        {filtered.length === 0 ? (
          <div className="border border-border p-12 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Nessun paper trovato.
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

