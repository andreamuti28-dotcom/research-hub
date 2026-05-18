import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getPaper, formatDateShort } from "@/data/papers";

export const Route = createFileRoute("/paper/$slug")({
  loader: ({ params }) => {
    const paper = getPaper(params.slug);
    if (!paper) throw notFound();
    return { paper };
  },
  head: ({ loaderData }) => {
    const paper = loaderData?.paper;
    return {
      meta: paper
        ? [
            { title: `${paper.title} — Studio / Marco Rossi` },
            { name: "description", content: paper.abstract },
            { property: "og:title", content: paper.title },
            { property: "og:description", content: paper.abstract },
            { property: "og:type", content: "article" },
          ]
        : [{ title: "Paper non trovato" }],
    };
  },
  notFoundComponent: NotFound,
  component: PaperDetail,
});

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 max-w-3xl mx-auto px-6 py-32 text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          404
        </div>
        <h1 className="text-3xl font-display font-bold tracking-tighter italic mb-6">
          Paper non trovato
        </h1>
        <Link
          to="/archivio"
          className="inline-block px-4 py-2 bg-foreground text-background font-display text-[11px] font-bold uppercase tracking-wider hover:bg-primary transition-colors"
        >
          Torna all'archivio
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}

function PaperDetail() {
  const { paper } = Route.useLoaderData();

  const shareUrl =
    typeof window !== "undefined" ? window.location.href : "";
  const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    shareUrl,
  )}`;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <article className="max-w-3xl mx-auto px-6 py-16 md:py-24 w-full">
        <Link
          to="/archivio"
          className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-12 inline-block"
        >
          ← Archivio
        </Link>

        <header className="mb-12 animate-fade-up">
          <div className="font-mono text-xs text-muted-foreground mb-6 flex flex-wrap items-center gap-3">
            <span>{formatDateShort(paper.date)}</span>
            <span className="text-border">/</span>
            <span className="text-primary uppercase tracking-tighter">
              {paper.tags.map((t: string) => `#${t}`).join(" ")}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tighter leading-[1.05] text-balance italic mb-8">
            {paper.title}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed text-pretty max-w-[60ch]">
            {paper.abstract}
          </p>
        </header>

        <div className="flex flex-wrap gap-3 mb-12 font-display text-[11px] font-bold uppercase tracking-wider border-y border-border py-4">
          {paper.pdfUrl && (
            <a
              href={paper.pdfUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="px-4 py-2 bg-foreground text-background hover:bg-primary transition-colors"
            >
              Scarica PDF
            </a>
          )}
          <a
            href={linkedinShare}
            target="_blank"
            rel="noreferrer noopener"
            className="px-4 py-2 border border-border hover:border-foreground transition-colors"
          >
            Condividi su LinkedIn
          </a>
        </div>

        <div className="prose-paper space-y-6 text-lg leading-[1.75] text-foreground/90">
          {paper.content.split("\n\n").map((para: string, i: number) => (
            <p key={i} className="text-pretty">
              {para}
            </p>
          ))}
        </div>
      </article>

      <div className="flex-1" />
      <SiteFooter />
    </div>
  );
}
