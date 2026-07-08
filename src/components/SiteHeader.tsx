import { Link } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useT } from "@/lib/i18n";

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
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
