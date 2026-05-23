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
      className="sticky top-0 z-50 backdrop-blur-md border-b border-border"
      style={{ backgroundColor: headerBg }}
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
          <Link
            to="/admin"
            aria-label={t("nav.userArea")}
            title={t("nav.userArea")}
            className="inline-flex items-center justify-center w-8 h-8 bg-foreground text-background rounded-xs hover:bg-primary transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  );
}
