import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

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
          <div className="hidden md:flex gap-6 font-display text-[11px] uppercase tracking-widest mr-auto ml-8">
            <Link to="/admin" activeOptions={{ exact: true }} className="hover:text-background transition-colors" activeProps={{ className: "text-background" }}>Dashboard</Link>
            <Link to="/admin/new" className="hover:text-background transition-colors" activeProps={{ className: "text-background" }}>Nuovo Paper</Link>
            <Link to="/admin/news" className="hover:text-background transition-colors" activeProps={{ className: "text-background" }}>News</Link>
            <Link to="/admin/market-sync" className="hover:text-background transition-colors" activeProps={{ className: "text-background" }}>Mercati</Link>
            <Link to="/admin/dashboards" className="hover:text-background transition-colors" activeProps={{ className: "text-background" }}>Dashboard</Link>
            <Link to="/admin/users" className="hover:text-background transition-colors" activeProps={{ className: "text-background" }}>Utenti</Link>
            <Link to="/admin/keys" className="hover:text-background transition-colors" activeProps={{ className: "text-background" }}>Chiavi</Link>
            <Link to="/admin/content" className="hover:text-background transition-colors" activeProps={{ className: "text-background" }}>Contenuti</Link>
            <Link to="/admin/settings" className="hover:text-background transition-colors" activeProps={{ className: "text-background" }}>Profilo</Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 font-mono text-[10px] uppercase tracking-widest shrink-0">
            <Link to="/" target="_blank" className="hidden sm:inline hover:text-background transition-colors">↗ Pubblico</Link>
            <button
              type="button"
              onClick={onLogout}
              className="px-2 sm:px-3 py-1 border border-surface-dark-muted hover:border-background hover:text-background transition-colors"
            >
              Esci
            </button>
          </div>
        </div>
        {/* Mobile sub-nav */}
        <div className="md:hidden border-t border-surface-dark-muted bg-surface-dark/95 overflow-x-auto">
          <div className="flex gap-4 px-4 py-2 font-display text-[10px] uppercase tracking-widest whitespace-nowrap">
            <Link to="/admin" activeOptions={{ exact: true }} className="hover:text-background" activeProps={{ className: "text-background" }}>Dashboard</Link>
            <Link to="/admin/new" className="hover:text-background" activeProps={{ className: "text-background" }}>Nuovo Paper</Link>
            <Link to="/admin/news" className="hover:text-background" activeProps={{ className: "text-background" }}>News</Link>
            <Link to="/admin/market-sync" className="hover:text-background" activeProps={{ className: "text-background" }}>Mercati</Link>
            <Link to="/admin/dashboards" className="hover:text-background" activeProps={{ className: "text-background" }}>Dashboard</Link>
            <Link to="/admin/users" className="hover:text-background" activeProps={{ className: "text-background" }}>Utenti</Link>
            <Link to="/admin/keys" className="hover:text-background" activeProps={{ className: "text-background" }}>Chiavi</Link>
            <Link to="/admin/content" className="hover:text-background" activeProps={{ className: "text-background" }}>Contenuti</Link>
            <Link to="/admin/settings" className="hover:text-background" activeProps={{ className: "text-background" }}>Profilo</Link>
            <Link to="/" target="_blank" className="hover:text-background ml-auto">↗ Pubblico</Link>
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
