import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import {
  getMarketSyncStatus,
  syncMarketReportFromGoogleDoc,
  updateMarketSyncConfig,
  type MarketSyncStatus,
} from "@/lib/market-reports.functions";

export const Route = createFileRoute("/admin/market-sync")({
  head: () => ({
    meta: [
      { title: "Sincronizzazione Mercati — Area Riservata" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/admin/login" });
  },
  component: AdminMarketSync,
});

const SCHEDULES = [
  { value: "manual", label: "Solo manuale" },
  { value: "daily_7am", label: "Ogni giorno alle 07:00 (Europe/Rome)" },
  { value: "weekdays_7am", label: "Ogni giorno feriale (Mar–Sab) alle 07:00" },
  { value: "hourly", label: "Ogni ora" },
  { value: "daily", label: "Ogni giorno" },
  { value: "weekly", label: "Ogni settimana" },
] as const;

function AdminMarketSync() {
  const queryClient = useQueryClient();
  const statusFn = useServerFn(getMarketSyncStatus);
  const syncFn = useServerFn(syncMarketReportFromGoogleDoc);
  const saveFn = useServerFn(updateMarketSyncConfig);
  const listFn = useServerFn(listArchivedMarketReports);
  const updateFn = useServerFn(updateMarketReport);
  const deleteFn = useServerFn(deleteMarketReport);

  const statusQuery = useQuery({
    queryKey: ["admin", "market-sync"],
    queryFn: () => statusFn(),
  });

  const archiveQuery = useQuery({
    queryKey: ["admin", "market-archive"],
    queryFn: () => listFn(),
  });

  const [docId, setDocId] = useState("");
  const [schedule, setSchedule] = useState<MarketSyncStatus["marketSyncSchedule"]>("daily_7am");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  useEffect(() => {
    if (statusQuery.data) {
      setDocId(statusQuery.data.marketDocId);
      setSchedule(statusQuery.data.marketSyncSchedule);
    }
  }, [statusQuery.data]);

  const syncMutation = useMutation({
    mutationFn: (overrideId?: string) =>
      syncFn({ data: overrideId ? { documentId: overrideId } : {} }),
    onSuccess: (res) => {
      toast.success(`Sincronizzato: ${res.title}`);
      queryClient.invalidateQueries({ queryKey: ["admin", "market-sync"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "market-archive"] });
      queryClient.invalidateQueries({ queryKey: ["market-reports"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Errore sync"),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      saveFn({ data: { marketDocId: docId.trim(), marketSyncSchedule: schedule } }),
    onSuccess: () => {
      toast.success("Impostazioni salvate");
      queryClient.invalidateQueries({ queryKey: ["admin", "market-sync"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Errore salvataggio"),
  });

  const editMutation = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          id: editingId!,
          title: editTitle,
          content: editContent,
          reportDate: editDate,
        },
      }),
    onSuccess: () => {
      toast.success("Report aggiornato");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "market-archive"] });
      queryClient.invalidateQueries({ queryKey: ["market-reports"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Errore"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Report eliminato");
      setPendingDelete(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "market-archive"] });
      queryClient.invalidateQueries({ queryKey: ["market-reports"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Errore"),
  });

  const status = statusQuery.data;
  const archive = archiveQuery.data ?? [];

  return (
    <AdminShell title="Sincronizzazione Mercati">
      <div className="space-y-8 max-w-3xl">
        <section className="border border-surface-dark-muted bg-surface-dark-muted/20 p-6">
          <h2 className="font-display text-sm uppercase tracking-widest text-background mb-4">
            Ultima sincronizzazione
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
            <div>
              <dt className="text-surface-dark-foreground/50 uppercase tracking-widest text-[10px] mb-1">Data / ora</dt>
              <dd className="text-background tabular-nums">
                {status?.lastSyncAt
                  ? new Date(status.lastSyncAt).toLocaleString("it-IT", {
                      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })
                  : "Mai sincronizzato"}
              </dd>
            </div>
            <div>
              <dt className="text-surface-dark-foreground/50 uppercase tracking-widest text-[10px] mb-1">Documento importato</dt>
              <dd className="text-background break-words">{status?.lastSyncFile ?? "—"}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={() => syncMutation.mutate(undefined)}
            disabled={syncMutation.isPending}
            className="mt-6 px-5 py-3 bg-primary text-primary-foreground font-display text-xs font-bold uppercase tracking-widest hover:opacity-90 disabled:opacity-50"
          >
            {syncMutation.isPending ? "Sincronizzazione…" : "↻ Sincronizza ora"}
          </button>
        </section>

        <section className="border border-surface-dark-muted bg-surface-dark-muted/20 p-6">
          <h2 className="font-display text-sm uppercase tracking-widest text-background mb-4">Configurazione</h2>
          <label className="block mb-5">
            <span className="block font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60 mb-2">ID Google Doc</span>
            <input
              type="text"
              value={docId}
              onChange={(e) => setDocId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-dark border border-surface-dark-muted text-background font-mono text-xs focus:outline-none focus:border-primary"
            />
          </label>
          <label className="block mb-5">
            <span className="block font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60 mb-2">Pianificazione automatica</span>
            <select
              value={schedule}
              onChange={(e) => setSchedule(e.target.value as MarketSyncStatus["marketSyncSchedule"])}
              className="w-full px-3 py-2 bg-surface-dark border border-surface-dark-muted text-background font-mono text-xs focus:outline-none focus:border-primary"
            >
              {SCHEDULES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !docId.trim()}
            className="px-4 py-2 bg-background text-foreground font-display text-[11px] font-bold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
          >
            {saveMutation.isPending ? "Salvataggio…" : "Salva impostazioni"}
          </button>
        </section>

        <section className="border border-surface-dark-muted bg-surface-dark-muted/20 p-6">
          <h2 className="font-display text-sm uppercase tracking-widest text-background mb-4">
            Archivio report ({archive.length})
          </h2>
          {archive.length === 0 ? (
            <p className="font-mono text-xs text-surface-dark-foreground/60">Nessun report in archivio.</p>
          ) : (
            <ul className="divide-y divide-surface-dark-muted">
              {archive.map((r) => (
                <li key={r.id} className="py-4">
                  {editingId === r.id ? (
                    <div className="space-y-2">
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-dark border border-surface-dark-muted text-background font-mono text-xs"
                      />
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-dark border border-surface-dark-muted text-background font-mono text-xs"
                      />
                      <textarea
                        rows={10}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 bg-surface-dark border border-surface-dark-muted text-background font-mono text-xs"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => editMutation.mutate()}
                          disabled={editMutation.isPending}
                          className="px-3 py-1.5 bg-primary text-primary-foreground font-display text-[11px] font-bold uppercase tracking-wider disabled:opacity-50"
                        >
                          Salva
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 border border-surface-dark-muted text-background font-display text-[11px] font-bold uppercase tracking-wider"
                        >
                          Annulla
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-2 mb-1">
                          <span className="text-background font-serif text-sm truncate">{r.title}</span>
                          {r.isCurrent && (
                            <span className="font-mono text-[9px] bg-primary text-primary-foreground px-1.5 py-0.5 uppercase tracking-widest">Live</span>
                          )}
                          <span className="font-mono text-[10px] text-surface-dark-foreground/60 uppercase tracking-widest">
                            {new Date(r.reportDate).toLocaleDateString("it-IT")}
                          </span>
                        </div>
                        <p className="font-mono text-[10px] text-surface-dark-foreground/50 line-clamp-2 whitespace-pre-wrap">
                          {r.content.slice(0, 200)}
                        </p>
                      </div>
                      <div className="flex gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(r.id);
                            setEditTitle(r.title);
                            setEditContent(r.content);
                            setEditDate(r.reportDate);
                          }}
                          className="text-primary hover:text-background font-mono text-[10px] uppercase tracking-widest font-bold"
                        >
                          Modifica
                        </button>
                        {pendingDelete === r.id ? (
                          <button
                            type="button"
                            onClick={() => deleteMutation.mutate(r.id)}
                            disabled={deleteMutation.isPending}
                            className="text-destructive hover:text-background font-mono text-[10px] uppercase tracking-widest font-bold"
                          >
                            Conferma?
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPendingDelete(r.id)}
                            className="text-surface-dark-foreground/70 hover:text-destructive font-mono text-[10px] uppercase tracking-widest font-bold"
                          >
                            Elimina
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
