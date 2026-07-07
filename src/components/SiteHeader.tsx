import { Link } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useT } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const DASHBOARDS = [
  { to: "/mutuo", label: "Simulazione Mutuo" },
] as const;

export function SiteHeader() {
  const { name, headerBg } = useSiteSettings();
  const t = useT();
  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-md border-b border-border bg-background"
      style={headerBg ? { backgroundColor: headerBg } : undefined}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        <Link
          to="/about"
          className="font-display font-bold tracking-tighter text-sm sm:text-lg uppercase truncate min-w-0 hover:text-primary transition-colors"
        >
          {name}
        </Link>
        <div className="flex gap-2 sm:gap-4 items-center text-xs sm:text-sm font-display uppercase tracking-wider shrink-0">
          <Link
            to="/"
            className="hover:text-primary transition-colors"
            activeProps={{ className: "text-primary" }}
            activeOptions={{ exact: true }}
          >
            {t("nav.home")}
          </Link>
          <Link
            to="/archivio"
            className="hover:text-primary transition-colors"
            activeProps={{ className: "text-primary" }}
          >
            {t("nav.archive")}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 hover:text-primary transition-colors font-display uppercase tracking-wider outline-none">
              <span className="hidden sm:inline">Dashboard Interattive</span>
              <span className="sm:hidden">Dashboard</span>
              <ChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px]">
              {DASHBOARDS.map((d) => (
                <DropdownMenuItem key={d.to} asChild>
                  <Link to={d.to} className="cursor-pointer font-display uppercase tracking-wider text-xs">
                    {d.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
