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
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to="/admin"
              className="font-display font-bold tracking-tighter uppercase text-sm"
            >
              CMS / Studio
            </Link>
            <div className="hidden md:flex gap-6 font-display text-[11px] uppercase tracking-widest">
              <Link
                to="/admin"
                activeOptions={{ exact: true }}
                className="hover:text-background transition-colors"
                activeProps={{ className: "text-background" }}
              >
                Dashboard
              </Link>
              <Link
                to="/admin/new"
                className="hover:text-background transition-colors"
                activeProps={{ className: "text-background" }}
              >
                Nuovo Paper
              </Link>
              <Link
                to="/admin/settings"
                className="hover:text-background transition-colors"
                activeProps={{ className: "text-background" }}
              >
                Profilo & Sito
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-widest">
            <Link
              to="/"
              target="_blank"
              className="hover:text-background transition-colors"
            >
              ↗ Vista pubblica
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1 border border-surface-dark-muted hover:border-background hover:text-background transition-colors"
            >
              Esci
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-10 md:py-14 w-full">
        <div className="mb-10">
          <div className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60 mb-2">
            /admin
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tighter text-background">
            {title}
          </h1>
        </div>
        {children}
      </main>
    </div>
  );
}
