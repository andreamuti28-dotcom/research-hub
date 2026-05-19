import { Link } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useT } from "@/lib/i18n";

export function SiteFooter() {
  const { name, linkedinUrl } = useSiteSettings();
  const t = useT();
  return (
    <footer className="py-12 border-t border-border">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <div>© {new Date().getFullYear()} {name} / {t("footer.research")}</div>
        <div className="flex gap-8">
          <Link to="/archivio" className="hover:text-foreground transition-colors">
            {t("nav.archive")}
          </Link>
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-foreground transition-colors"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}
