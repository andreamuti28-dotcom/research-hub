import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const NAV_GROUPS: {
  label: string;
  items: { to: string; label: string; exact?: boolean }[];
}[] = [
  {
    label: "Contenuti",
    items: [
      { to: "/admin", label: "Recap", exact: true },
      { to: "/admin/new", label: "Nuovo Paper" },
      { to: "/admin/content", label: "Contenuti" },
    ],
  },
  {
    label: "Dati",
    items: [
      { to: "/admin/news", label: "News" },
      { to: "/admin/market-sync", label: "Mercati" },
      { to: "/admin/dashboards", label: "Dashboard" },
    ],
  },
  {
    label: "Impostazioni",
    items: [
      { to: "/admin/users", label: "Utenti" },
      { to: "/admin/keys", label: "Chiavi" },
      { to: "/admin/settings", label: "Profilo" },
    ],
  },
];

export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const navigate = useNavigate();
  const onLogout = async () => {
    await supabase.auth.signOut();
    await navigate({ to: "/admin/login" });
  };

  return (
    <div className="min-h-screen bg-surface-dark text-surface-dark-foreground flex flex-col">
      <nav className="border-b border-surface-dark-muted bg-surface-dark/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link
            to="/admin"
            className="font-display font-bold tracking-tighter uppercase text-xs sm:text-sm shrink-0"
          >
            CMS
          </Link>
          <div className="hidden lg:flex items-center gap-6 mr-auto ml-8">
            {NAV_GROUPS.map((g, i) => (
              <div key={g.label} className="flex items-center gap-6">
                {i > 0 && (
                  <span className="h-4 w-px bg-surface-dark-muted" aria-hidden />
                )}
                <div className="flex flex-col">
                  <span className="font-mono text-[8px] uppercase tracking-widest text-surface-dark-foreground/40">
                    {g.label}
                  </span>
                  <div className="flex gap-4 font-display text-[11px] uppercase tracking-widest">
                    {g.items.map((it) => (
                      <Link
                        key={it.to}
                        to={it.to}
                        activeOptions={it.exact ? { exact: true } : undefined}
                        className="hover:text-background transition-colors"
                        activeProps={{ className: "text-background" }}
                      >
                        {it.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 font-mono text-[10px] uppercase tracking-widest shrink-0">
            <Link to="/" target="_blank" className="hidden sm:inline hover:text-background transition-colors">
              ↗ Pubblico
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="px-2 sm:px-3 py-1 border border-surface-dark-muted hover:border-background hover:text-background transition-colors"
            >
              Esci
            </button>
          </div>
        </div>

        {/* Compact grouped nav for small screens: every destination stays visible. */}
        <div className="lg:hidden border-t border-surface-dark-muted bg-surface-dark/95 px-4 py-2 space-y-1.5">
          {NAV_GROUPS.map((g) => (
            <div key={g.label} className="flex items-baseline gap-3">
              <span className="font-mono text-[8px] uppercase tracking-widest text-surface-dark-foreground/40 w-16 shrink-0">
                {g.label}
              </span>
              <div className="flex flex-wrap gap-x-3 gap-y-1 font-display text-[10px] uppercase tracking-widest">
                {g.items.map((it) => (
                  <Link
                    key={it.to}
                    to={it.to}
                    activeOptions={it.exact ? { exact: true } : undefined}
                    className="hover:text-background"
                    activeProps={{ className: "text-background" }}
                  >
                    {it.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div className="pt-1">
            <Link
              to="/"
              target="_blank"
              className="font-mono text-[10px] uppercase tracking-widest hover:text-background"
            >
              ↗ Pubblico
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 md:py-14 w-full">
        <div className="mb-6 sm:mb-10">
          <div className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60 mb-2">
            /admin
          </div>
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold tracking-tighter text-background break-words">
            {title}
          </h1>
        </div>
        {children}
      </main>
    </div>
  );
}
