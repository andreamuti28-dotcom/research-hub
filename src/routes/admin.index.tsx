import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import {
  checkAdminStatus,
  listAllPapers,
  deletePaper,
} from "@/lib/admin-papers.functions";
import { formatDateShort } from "@/data/papers";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Area Riservata" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/admin/login" });
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const checkAdmin = useServerFn(checkAdminStatus);
  const listFn = useServerFn(listAllPapers);
  const deleteFn = useServerFn(deletePaper);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const adminQuery = useQuery({
    queryKey: ["admin", "status"],
    queryFn: () => checkAdmin(),
  });

  const papersQuery = useQuery({
    queryKey: ["admin", "papers"],
    queryFn: () => listFn(),
    enabled: adminQuery.data?.isAdmin === true,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "papers"] });
      queryClient.invalidateQueries({ queryKey: ["papers"] });
      setPendingDelete(null);
    },
  });

  if (adminQuery.isLoading) {
    return (
      <AdminShell title="Caricamento…">
        <div className="font-mono text-xs text-surface-dark-foreground/60">
          Verifica accesso in corso…
        </div>
      </AdminShell>
    );
  }

  if (!adminQuery.data?.isAdmin) {
    return (
      <AdminShell title="Accesso non autorizzato">
        <p className="text-surface-dark-foreground/70 max-w-prose mb-6">
          Il tuo account non ha permessi di amministratore. Solo il primo
          utente registrato ottiene il ruolo admin.
        </p>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.navigate({ to: "/admin/login" });
          }}
          className="px-4 py-2 border border-surface-dark-muted font-display text-[11px] font-bold uppercase tracking-wider hover:border-background hover:text-background transition-colors"
        >
          Esci
        </button>
      </AdminShell>
    );
  }

  const papers = papersQuery.data ?? [];
  const totalViews = papers.reduce((s, p) => s + (p.views ?? 0), 0);
  const totalDownloads = papers.reduce((s, p) => s + (p.downloads ?? 0), 0);
  const published = papers.filter((p) => p.is_published).length;

  return (
    <AdminShell title="Dashboard CMS">
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        <StatCard label="Visualizzazioni totali" value={totalViews.toLocaleString("it-IT")} />
        <StatCard label="Download PDF" value={totalDownloads.toLocaleString("it-IT")} />
        <StatCard label="Paper pubblicati" value={`${published} / ${papers.length}`} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-sm uppercase tracking-widest text-surface-dark-foreground/70">
          Paper
        </h2>
        <Link
          to="/admin/new"
          className="px-4 py-2 bg-background text-foreground font-display text-[11px] font-bold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          + Nuovo Paper
        </Link>
      </div>

      <div className="border border-surface-dark-muted overflow-hidden">
        {papers.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs uppercase tracking-widest text-surface-dark-foreground/50">
            Nessun paper. Inizia creando il primo.
          </div>
        ) : (
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-surface-dark-muted/40 text-surface-dark-foreground/60 uppercase tracking-widest text-[10px]">
              <tr>
                <th className="p-4">Titolo</th>
                <th className="p-4 hidden md:table-cell">Data</th>
                <th className="p-4 hidden md:table-cell text-right">Views</th>
                <th className="p-4 hidden md:table-cell text-right">PDF</th>
                <th className="p-4">Stato</th>
                <th className="p-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-dark-muted">
              {papers.map((p) => (
                <tr key={p.id} className="hover:bg-surface-dark-muted/20">
                  <td className="p-4 text-background font-serif text-sm">{p.title}</td>
                  <td className="p-4 hidden md:table-cell text-surface-dark-foreground/70">
                    {formatDateShort(p.published_date)}
                  </td>
                  <td className="p-4 hidden md:table-cell text-right tabular-nums">
                    {p.views}
                  </td>
                  <td className="p-4 hidden md:table-cell text-right tabular-nums">
                    {p.downloads}
                  </td>
                  <td className="p-4">
                    {p.is_published ? (
                      <span className="px-2 py-0.5 bg-emerald-900/40 text-emerald-400 border border-emerald-800">
                        PUBBLICATO
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-surface-dark-muted text-surface-dark-foreground/70">
                        BOZZA
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="inline-flex gap-3">
                      <Link
                        to="/admin/edit/$id"
                        params={{ id: p.id }}
                        className="text-primary hover:text-background uppercase font-bold"
                      >
                        Modifica
                      </Link>
                      {pendingDelete === p.id ? (
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(p.id)}
                          disabled={deleteMutation.isPending}
                          className="text-destructive hover:text-background uppercase font-bold"
                        >
                          Conferma?
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setPendingDelete(p.id)}
                          className="text-surface-dark-foreground/70 hover:text-destructive uppercase font-bold"
                        >
                          Elimina
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-dark-muted/30 p-6 border border-surface-dark-muted">
      <div className="text-surface-dark-foreground/50 font-mono text-[10px] uppercase tracking-widest mb-3">
        {label}
      </div>
      <div className="text-3xl font-display text-background tabular-nums">
        {value}
      </div>
    </div>
  );
}
