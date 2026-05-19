import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminShell } from "@/components/AdminShell";
import { listAuthUsers } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "Utenti registrati — Area Riservata" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/admin/login" });
  },
  component: AdminUsers,
});

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AdminUsers() {
  const listFn = useServerFn(listAuthUsers);
  const usersQuery = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => listFn(),
  });

  if (usersQuery.isLoading) {
    return (
      <AdminShell title="Utenti registrati">
        <div className="font-mono text-xs text-surface-dark-foreground/60">
          Caricamento utenti…
        </div>
      </AdminShell>
    );
  }

  if (usersQuery.error) {
    return (
      <AdminShell title="Utenti registrati">
        <div className="border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 text-sm font-display">
          {usersQuery.error instanceof Error
            ? usersQuery.error.message
            : "Errore nel caricamento utenti"}
        </div>
      </AdminShell>
    );
  }

  const users = usersQuery.data ?? [];
  const confirmed = users.filter((u) => u.emailConfirmedAt).length;

  return (
    <AdminShell title="Utenti registrati">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-8">
        <Stat label="Totale" value={users.length.toString()} />
        <Stat label="Email confermate" value={confirmed.toString()} />
        <Stat
          label="Admin"
          value={users.filter((u) => u.role === "admin").length.toString()}
        />
      </div>

      {users.length === 0 ? (
        <div className="border border-surface-dark-muted p-8 text-center font-mono text-xs uppercase tracking-widest text-surface-dark-foreground/50">
          Nessun utente registrato.
        </div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden md:block border border-surface-dark-muted overflow-hidden">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-surface-dark-muted/40 text-surface-dark-foreground/60 uppercase tracking-widest text-[10px]">
                <tr>
                  <th className="p-4">Email</th>
                  <th className="p-4">Ruolo</th>
                  <th className="p-4">Registrato</th>
                  <th className="p-4">Ultimo accesso</th>
                  <th className="p-4">Conferma email</th>
                  <th className="p-4">Provider</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-dark-muted">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-dark-muted/20">
                    <td className="p-4 text-background break-all">
                      {u.email ?? "—"}
                    </td>
                    <td className="p-4">
                      {u.role === "admin" ? (
                        <span className="px-2 py-0.5 bg-primary/20 text-primary border border-primary/40 uppercase tracking-widest">
                          Admin
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-surface-dark-muted text-surface-dark-foreground/70 uppercase tracking-widest">
                          User
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-surface-dark-foreground/70">
                      {formatDateTime(u.createdAt)}
                    </td>
                    <td className="p-4 text-surface-dark-foreground/70">
                      {formatDateTime(u.lastSignInAt)}
                    </td>
                    <td className="p-4 text-surface-dark-foreground/70">
                      {u.emailConfirmedAt ? "Sì" : "No"}
                    </td>
                    <td className="p-4 text-surface-dark-foreground/70 uppercase">
                      {u.provider ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="border border-surface-dark-muted p-4 bg-surface-dark-muted/20"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-background text-sm break-all flex-1">
                    {u.email ?? "—"}
                  </span>
                  <span
                    className={`font-mono text-[9px] px-2 py-0.5 uppercase tracking-wider shrink-0 ${
                      u.role === "admin"
                        ? "bg-primary/20 text-primary border border-primary/40"
                        : "bg-surface-dark-muted text-surface-dark-foreground/70"
                    }`}
                  >
                    {u.role ?? "user"}
                  </span>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60 space-y-1">
                  <div>Iscritto: {formatDateTime(u.createdAt)}</div>
                  <div>Ultimo accesso: {formatDateTime(u.lastSignInAt)}</div>
                  <div>
                    Email: {u.emailConfirmedAt ? "confermata" : "non confermata"}
                    {u.provider ? ` · ${u.provider}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-dark-muted/30 p-4 sm:p-6 border border-surface-dark-muted">
      <div className="text-surface-dark-foreground/50 font-mono text-[10px] uppercase tracking-widest mb-2">
        {label}
      </div>
      <div className="text-2xl sm:text-3xl font-display text-background tabular-nums">
        {value}
      </div>
    </div>
  );
}
