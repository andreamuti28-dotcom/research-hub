import { Link } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/use-site-settings";

export function SiteHeader() {
  const { name } = useSiteSettings();
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="font-display font-bold tracking-tighter text-lg uppercase"
        >
          {name}
        </Link>
        <div className="flex gap-6 md:gap-8 items-center text-sm font-display uppercase tracking-wider">
          <Link
            to="/archivio"
            className="hover:text-primary transition-colors"
            activeProps={{ className: "text-primary" }}
          >
            Archivio
          </Link>
          <Link
            to="/admin"
            className="px-3 py-1 bg-foreground text-background rounded-xs hover:bg-primary transition-colors"
          >
            Area Riservata
          </Link>
        </div>
      </div>
    </nav>
  );
}
