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
      { title: "Archivio — Studio / Marco Rossi" },
      {
        name: "description",
        content:
          "Archivio completo dei paper di ricerca pubblicati. Filtra per categoria o cerca per parola chiave.",
      },
      { property: "og:title", content: "Archivio — Studio / Marco Rossi" },
      {
        property: "og:description",
        content: "Tutti i paper di ricerca pubblicati.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(papersQuery),
  component: Archivio,
});

function Archivio() {
  const { data: papers } = useSuspenseQuery(papersQuery);
  const [query, setQuery] = useState("");
  const [tag, setTag] = useState<string>("");

  const allTags = useMemo(
    () => Array.from(new Set(papers.flatMap((p) => p.tags))).sort(),
    [papers],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return papers.filter((p) => {
      if (tag && !p.tags.includes(tag)) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.abstract.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [papers, query, tag]);

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
            {papers.length} paper indicizzati. Filtra per tag o cerca per
            parola chiave.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-3 md:gap-4 mb-10">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca per titolo, abstract o tag…"
            className="bg-background border border-border px-4 py-2.5 text-sm font-display focus:outline-none focus:ring-1 focus:ring-primary flex-1 md:max-w-md"
          />
          <select
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="bg-background border border-border px-4 py-2.5 text-sm font-display focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Tutti i tag</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
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
