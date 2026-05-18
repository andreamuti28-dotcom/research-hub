import { Link } from "@tanstack/react-router";
import type { Paper } from "@/data/papers";
import { formatDate } from "@/data/papers";

export function PaperRow({ paper }: { paper: Paper }) {
  return (
    <article className="group bg-background p-6 md:p-8 md:grid md:grid-cols-[200px_1fr] gap-12 transition-colors hover:bg-surface">
      <div className="font-mono text-xs text-muted-foreground mb-4 md:mb-0">
        <div className="mb-1 uppercase">{formatDate(paper.publishedDate)}</div>
        <div className="text-primary uppercase tracking-tighter">
          {paper.tags.map((t) => `#${t}`).join(" ")}
        </div>
      </div>
      <div>
        <Link
          to="/paper/$slug"
          params={{ slug: paper.slug }}
          className="block"
        >
          <h3 className="text-2xl font-display font-bold tracking-tight mb-4 group-hover:text-primary transition-colors text-balance">
            {paper.title}
          </h3>
        </Link>
        <p className="text-muted-foreground max-w-[65ch] mb-8 leading-relaxed">
          {paper.abstract}
        </p>
        <div className="flex flex-wrap gap-3 font-display text-[11px] font-bold uppercase tracking-wider">
          <Link
            to="/paper/$slug"
            params={{ slug: paper.slug }}
            className="px-4 py-2 bg-foreground text-background hover:bg-primary transition-colors"
          >
            Leggi Online
          </Link>
          {paper.pdfUrl && (
            <a
              href={`${paper.pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              PDF
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
