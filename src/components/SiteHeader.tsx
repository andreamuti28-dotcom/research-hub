import { Link } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { ThemeToggle } from "@/components/ThemeToggle";

export function SiteHeader() {
  const { name } = useSiteSettings();
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        <Link
          to="/"
          className="font-display font-bold tracking-tighter text-sm sm:text-lg uppercase truncate min-w-0"
        >
          {name}
        </Link>
        <div className="flex gap-2 sm:gap-5 items-center text-xs sm:text-sm font-display uppercase tracking-wider shrink-0">
          <Link
            to="/archivio"
            className="hover:text-primary transition-colors"
            activeProps={{ className: "text-primary" }}
          >
            Archivio
          </Link>
          <ThemeToggle />
          <Link
            to="/admin"
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-foreground text-background rounded-xs hover:bg-primary transition-colors whitespace-nowrap"
          >
            <span className="hidden sm:inline">Area Riservata</span>
            <span className="sm:hidden">Utente</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
