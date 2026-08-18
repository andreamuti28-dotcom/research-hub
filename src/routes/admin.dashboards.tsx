import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { AdminGuard } from "@/components/AdminGuard";
import {
  listAllDashboards,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  type DashboardRow,
} from "@/lib/dashboards.functions";
import { DASHBOARD_REGISTRY } from "@/lib/dashboard-registry";

export const Route = createFileRoute("/admin/dashboards")({
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
  component: () => (
    <AdminGuard>
      <AdminDashboards />
    </AdminGuard>
  ),
});

type FormState = {
  id?: string;
  componentKey: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  isPublished: boolean;
  sortOrder: number;
};

const REGISTRY_KEYS = Object.keys(DASHBOARD_REGISTRY);

function emptyForm(): FormState {
  const firstKey = REGISTRY_KEYS[0] ?? "";
  const preset = DASHBOARD_REGISTRY[firstKey];
  return {
    componentKey: firstKey,
    title: preset?.defaultTitle ?? "",
    titleEn: preset?.defaultTitleEn ?? "",
    description: "",
    descriptionEn: "",
    isPublished: true,
    sortOrder: 0,
  };
}

function AdminDashboards() {
  const listFn = useServerFn(listAllDashboards);
  const createFn = useServerFn(createDashboard);
  const updateFn = useServerFn(updateDashboard);
  const deleteFn = useServerFn(deleteDashboard);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin", "dashboards"],
    queryFn: () => listFn(),
  });

  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "dashboards"] });
    queryClient.invalidateQueries({ queryKey: ["dashboards", "published"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        componentKey: form.componentKey,
        title: form.title,
        titleEn: form.titleEn || null,
        description: form.description || null,
        descriptionEn: form.descriptionEn || null,
        isPublished: form.isPublished,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (form.id) {
        return updateFn({ data: { ...payload, id: form.id } });
      }
      return createFn({ data: payload });
    },
    onSuccess: () => {
      setForm(emptyForm());
      setError(null);
      invalidate();
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Errore salvataggio");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      setPendingDelete(null);
      invalidate();
    },
  });

  const rows = query.data ?? [];

  const startEdit = (row: DashboardRow) => {
    setForm({
      id: row.id,
      componentKey: row.component_key,
      title: row.title,
      titleEn: row.title_en ?? "",
      description: row.description ?? "",
      descriptionEn: row.description_en ?? "",
      isPublished: row.is_published,
      sortOrder: row.sort_order,
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AdminShell title="Dashboard Interattive">
      <p className="text-surface-dark-foreground/70 max-w-prose mb-8 text-sm">
        Gestisci le dashboard interattive mostrate sulla home. Ogni voce è
        collegata a un componente registrato nel codice (chiave componente).
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
        className="border border-surface-dark-muted bg-surface-dark-muted/20 p-5 sm:p-6 mb-10 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div className="md:col-span-2 flex items-center justify-between">
          <h2 className="font-display text-sm uppercase tracking-widest text-background">
            {form.id ? "Modifica dashboard" : "Nuova dashboard"}
          </h2>
          {form.id && (
            <button
              type="button"
              onClick={() => setForm(emptyForm())}
              className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/70 hover:text-background"
            >
              Annulla modifica
            </button>
          )}
        </div>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60">
            Componente
          </span>
          <select
            value={form.componentKey}
            onChange={(e) => {
              const key = e.target.value;
              const preset = DASHBOARD_REGISTRY[key];
              setForm((f) => ({
                ...f,
                componentKey: key,
                title: f.id ? f.title : preset?.defaultTitle ?? "",
                titleEn: f.id ? f.titleEn : preset?.defaultTitleEn ?? "",
              }));
            }}
            className="bg-surface-dark border border-surface-dark-muted p-2 text-sm text-background"
          >
            {REGISTRY_KEYS.map((k) => (
              <option key={k} value={k}>
                {k} — {DASHBOARD_REGISTRY[k].path}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60">
            Ordine
          </span>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) =>
              setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))
            }
            className="bg-surface-dark border border-surface-dark-muted p-2 text-sm text-background"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60">
            Titolo (IT)
          </span>
          <input
            required
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="bg-surface-dark border border-surface-dark-muted p-2 text-sm text-background"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60">
            Titolo (EN)
          </span>
          <input
            value={form.titleEn}
            onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))}
            className="bg-surface-dark border border-surface-dark-muted p-2 text-sm text-background"
          />
        </label>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60">
            Descrizione (IT)
          </span>
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="bg-surface-dark border border-surface-dark-muted p-2 text-sm text-background"
          />
        </label>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60">
            Descrizione (EN)
          </span>
          <textarea
            rows={2}
            value={form.descriptionEn}
            onChange={(e) =>
              setForm((f) => ({ ...f, descriptionEn: e.target.value }))
            }
            className="bg-surface-dark border border-surface-dark-muted p-2 text-sm text-background"
          />
        </label>

        <label className="flex items-center gap-2 md:col-span-2">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) =>
              setForm((f) => ({ ...f, isPublished: e.target.checked }))
            }
          />
          <span className="font-mono text-[11px] uppercase tracking-widest">
            Pubblicata
          </span>
        </label>

        {error && (
          <div className="md:col-span-2 font-mono text-xs text-destructive">
            {error}
          </div>
        )}

        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-4 py-2 bg-background text-foreground font-display text-[11px] font-bold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending
              ? "Salvataggio…"
              : form.id
                ? "Aggiorna"
                : "Crea dashboard"}
          </button>
        </div>
      </form>

      <h2 className="font-display text-xs sm:text-sm uppercase tracking-widest text-surface-dark-foreground/70 mb-4">
        Dashboard esistenti
      </h2>
      {rows.length === 0 ? (
        <div className="border border-surface-dark-muted p-8 text-center font-mono text-xs uppercase tracking-widest text-surface-dark-foreground/50">
          Nessuna dashboard. Creane una con il form sopra.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="border border-surface-dark-muted p-4 bg-surface-dark-muted/20"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <div className="font-serif text-background text-sm break-words">
                    {row.title}
                    {row.title_en && (
                      <span className="text-surface-dark-foreground/50">
                        {" "}
                        / {row.title_en}
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60 mt-1">
                    {row.component_key} · ordine {row.sort_order}
                  </div>
                </div>
                {row.is_published ? (
                  <span className="font-mono text-[9px] px-2 py-0.5 bg-emerald-900/40 text-emerald-400 border border-emerald-800 uppercase tracking-wider shrink-0">
                    Pub
                  </span>
                ) : (
                  <span className="font-mono text-[9px] px-2 py-0.5 bg-surface-dark-muted text-surface-dark-foreground/70 uppercase tracking-wider shrink-0">
                    Bozza
                  </span>
                )}
              </div>
              <div className="flex gap-4 font-mono text-[10px] uppercase tracking-widest">
                <button
                  type="button"
                  onClick={() => startEdit(row)}
                  className="text-primary font-bold hover:text-background"
                >
                  Modifica
                </button>
                {pendingDelete === row.id ? (
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(row.id)}
                    disabled={deleteMutation.isPending}
                    className="text-destructive font-bold"
                  >
                    Conferma?
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPendingDelete(row.id)}
                    className="text-surface-dark-foreground/70 font-bold hover:text-destructive"
                  >
                    Elimina
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
