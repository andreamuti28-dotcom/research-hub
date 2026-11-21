import { Link } from "@tanstack/react-router";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useT } from "@/lib/i18n";

export function SiteFooter() {
  const { name, linkedinUrl, contactEmail } = useSiteSettings();
  const t = useT();
  return (
    <footer className="py-10 border-t border-border">
      <div className="max-w-[1240px] mx-auto px-6 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-5 text-sm font-display text-muted-foreground">
        <div>
          © {new Date().getFullYear()} {name} / {t("footer.research")}
        </div>
        <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
          <Link to="/archivio" className="hover:text-foreground transition-colors">
            {t("nav.archive")}
          </Link>
          <Link to="/about" className="hover:text-foreground transition-colors">
            {t("nav.aboutPage")}
          </Link>
          <Link to="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link to="/cookie-policy" className="hover:text-foreground transition-colors">
            Cookie
          </Link>
          <Link to="/termini" className="hover:text-foreground transition-colors">
            {t("common.terms")}
          </Link>
          {contactEmail ? (
            <a href={`mailto:${contactEmail}`} className="hover:text-foreground transition-colors">
              {t("common.contact")}
            </a>
          ) : null}
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:text-foreground transition-colors"
          >
            {t("common.linkedin")}
          </a>
        </div>
      </div>
    </footer>
  );
}
