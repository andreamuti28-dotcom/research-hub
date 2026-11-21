import { Link } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useT } from "@/lib/i18n";

const NAV_LINK =
  "relative py-1 text-brand-muted hover:text-brand-fg transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-gold after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100";
const NAV_ACTIVE = "text-brand-fg after:scale-x-100";

export function SiteHeader() {
  const { name, headerBg } = useSiteSettings();
  const t = useT();
  return (
    <nav
      className="sticky top-0 z-50 bg-brand text-brand-fg border-b border-brand-line"
      style={headerBg ? { backgroundColor: headerBg } : undefined}
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-8 h-14 sm:h-[60px] flex items-center justify-between gap-3">
        <Link
          to="/"
          className="font-editorial text-lg sm:text-xl font-semibold truncate min-w-0 text-brand-fg hover:text-gold transition-colors"
        >
          {name}
        </Link>
        <div className="flex gap-3 sm:gap-7 items-center text-[13px] sm:text-sm font-display shrink-0">
          <Link
            to="/"
            className={NAV_LINK}
            activeProps={{ className: NAV_ACTIVE }}
            activeOptions={{ exact: true }}
          >
            {t("nav.home")}
          </Link>
          <Link to="/archivio" className={NAV_LINK} activeProps={{ className: NAV_ACTIVE }}>
            {t("nav.archive")}
          </Link>
          <Link to="/about" className={NAV_LINK} activeProps={{ className: NAV_ACTIVE }}>
            {t("nav.aboutPage")}
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <LanguageToggle onBrand />
            <ThemeToggle onBrand />
          </div>
        </div>
      </div>
    </nav>
  );
}
