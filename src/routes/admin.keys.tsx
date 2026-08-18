import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { AdminGuard } from "@/components/AdminGuard";
import { getProjectKeys, type ProjectKey } from "@/lib/admin-keys.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/keys")({
  head: () => ({
    meta: [
      { title: "Chiavi progetto — Area Riservata" },
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
      <AdminKeysPage />
    </AdminGuard>
  ),
});

function AdminKeysPage() {
  const fetchKeys = useServerFn(getProjectKeys);
  const keysQuery = useQuery({
    queryKey: ["admin", "project-keys"],
    queryFn: () => fetchKeys(),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <AdminShell title="Chiavi del progetto">
      <p className="font-mono text-[11px] uppercase tracking-widest text-surface-dark-foreground/60 mb-6">
        Variabili d'ambiente. I valori privati non lasciano mai il server: qui vedi solo un'anteprima mascherata.
      </p>

      {keysQuery.isLoading && (
        <div className="font-mono text-xs text-surface-dark-foreground/60">
          Caricamento chiavi…
        </div>
      )}
      {keysQuery.isError && (
        <div className="font-mono text-xs text-red-400">
          Errore: {(keysQuery.error as Error).message}
        </div>
      )}

      {keysQuery.data && (
        <div className="space-y-4">
          {keysQuery.data.map((k) => (
            <KeyRow key={k.name} k={k} />
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function KeyRow({ k }: { k: ProjectKey }) {
  const copy = async () => {
    if (!k.value) return;
    await navigator.clipboard.writeText(k.value);
    toast.success(`${k.name} copiata`);
  };

  return (
    <div className="border border-surface-dark-muted p-4 bg-surface-dark/50">
      <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
        <div>
          <div className="font-display font-bold text-background text-sm break-all">
            {k.name}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60 mt-1">
            {k.secret ? "🔒 Privata" : "🌐 Pubblica"}
          </div>
        </div>
        {!k.secret && (
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={copy}
              disabled={!k.value}
              className="px-3 py-1 border border-surface-dark-muted hover:border-background hover:text-background transition-colors font-mono text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Copia
            </button>
          </div>
        )}
      </div>

      <p className="font-mono text-[11px] text-surface-dark-foreground/70 mb-3">
        {k.description}
      </p>

      <div className="font-mono text-[11px] bg-black/40 border border-surface-dark-muted p-3 break-all min-h-[2.5rem]">
        {k.configured ? (
          <span className={k.secret ? "" : "select-all"}>{k.preview}</span>
        ) : (
          <span className="text-red-400">Non configurata</span>
        )}
      </div>

      {k.secret && (
        <p className="font-mono text-[10px] text-surface-dark-foreground/50 mt-2">
          Valore nascosto per sicurezza: gestiscilo dal gestore dei secret dell'hosting.
        </p>
      )}
    </div>
  );
}
