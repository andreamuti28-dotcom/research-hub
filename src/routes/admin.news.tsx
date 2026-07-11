import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { getNewsArchive, type ArchivedNewsItem } from "@/lib/news.functions";

export const Route = createFileRoute("/admin/news")({
  head: () => ({
    meta: [
      { title: "Archivio News — Area Riservata" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/admin/login" });
  },
  component: AdminNewsPage,
});

function groupByDay(items: ArchivedNewsItem[]) {
  const groups = new Map<string, { label: string; items: ArchivedNewsItem[] }>();
  for (const it of items) {
    const d = new Date(it.first_seen_at);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
    const g = groups.get(key) ?? { label, items: [] };
    g.items.push(it);
    groups.set(key, g);
  }
  return Array.from(groups.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, value]) => ({ key, ...value }));
}

function AdminNewsPage() {
  const fetchArchive = useServerFn(getNewsArchive);
  const q = useQuery({
    queryKey: ["admin", "news-archive"],
    queryFn: () => fetchArchive(),
    staleTime: 60 * 1000,
  });

  const groups = useMemo(() => groupByDay(q.data?.items ?? []), [q.data]);

  return (
    <AdminShell title="Archivio News Finanziarie">
      <p className="font-mono text-[11px] uppercase tracking-widest text-surface-dark-foreground/60 mb-6">
        Tutte le news viste dal sito, raggruppate per giorno di apparizione.
      </p>

      {q.isLoading && (
        <div className="font-mono text-xs text-surface-dark-foreground/60">
          Caricamento…
        </div>
      )}
      {q.isError && (
        <div className="border border-red-500/40 text-red-300 px-3 py-2 font-mono text-xs">
          Errore nel caricamento dell'archivio.
        </div>
      )}
      {!q.isLoading && groups.length === 0 && (
        <div className="font-mono text-xs text-surface-dark-foreground/60">
          Nessuna news archiviata.
        </div>
      )}

      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.key} className="border border-surface-dark-muted">
            <header className="flex items-baseline justify-between px-4 py-3 border-b border-surface-dark-muted bg-surface-dark/60">
              <h2 className="font-display text-sm font-bold tracking-tight text-background capitalize">
                {g.label}
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60">
                {g.items.length} {g.items.length === 1 ? "notizia" : "notizie"}
              </span>
            </header>
            <ul className="divide-y divide-surface-dark-muted">
              {g.items.map((it) => {
                const seen = new Date(it.first_seen_at);
                return (
                  <li key={it.url} className="px-4 py-3 flex items-start gap-4">
                    <time className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60 shrink-0 mt-0.5 tabular-nums">
                      {seen.toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                    <div className="min-w-0 flex-1">
                      <a
                        href={it.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="block text-sm text-background hover:text-primary transition-colors break-words"
                      >
                        {it.title}
                      </a>
                      {it.source && (
                        <div className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60 mt-1">
                          {it.source}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </AdminShell>
  );
}
