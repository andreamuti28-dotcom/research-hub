import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
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
  component: AdminKeysPage,
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
        Variabili d'ambiente da copiare in Vercel / GitHub Actions.
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
  const [revealed, setRevealed] = useState(!k.secret);

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
        <div className="flex gap-2 shrink-0">
          {k.secret && (
            <button
              type="button"
              onClick={() => setRevealed((r) => !r)}
              className="px-3 py-1 border border-surface-dark-muted hover:border-background hover:text-background transition-colors font-mono text-[10px] uppercase tracking-widest"
            >
              {revealed ? "Nascondi" : "Mostra"}
            </button>
          )}
          <button
            type="button"
            onClick={copy}
            disabled={!k.value}
            className="px-3 py-1 border border-surface-dark-muted hover:border-background hover:text-background transition-colors font-mono text-[10px] uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Copia
          </button>
        </div>
      </div>

      <p className="font-mono text-[11px] text-surface-dark-foreground/70 mb-3">
        {k.description}
      </p>

      <div className="font-mono text-[11px] bg-black/40 border border-surface-dark-muted p-3 break-all select-all min-h-[2.5rem]">
        {k.value
          ? revealed
            ? k.value
            : "•".repeat(Math.min(48, k.value.length))
          : <span className="text-red-400">Non configurata</span>}
      </div>
    </div>
  );
}
