import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="py-12 border-t border-border">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        <div>© {new Date().getFullYear()} Marco Rossi / Ricerca Autonoma</div>
        <div className="flex gap-8">
          <Link to="/archivio" className="hover:text-foreground transition-colors">
            Archivio
          </Link>
          <a
            href="https://www.linkedin.com"
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
