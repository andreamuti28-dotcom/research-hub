import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { formatDateShort } from "@/data/papers";
import { getPublishedPaperBySlug } from "@/lib/papers.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/paper/$slug")({
  loader: async ({ params }) => {
    const paper = await getPublishedPaperBySlug({ data: { slug: params.slug } });
    if (!paper) throw notFound();
    return { paper };
  },
  head: ({ loaderData }) => {
    const paper = loaderData?.paper;
    return {
      meta: paper
        ? [
            { title: `${paper.title} — Andrea Muti` },
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

  useEffect(() => {
    void supabase.rpc("increment_paper_views", { _slug: paper.slug });
  }, [paper.slug]);

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
            <span>{formatDateShort(paper.publishedDate)}</span>
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


        <div className="space-y-6 text-lg leading-[1.75] text-foreground/90">
          {paper.content
            .split("\n\n")
            .filter((p: string) => p.trim().length > 0)
            .map((para: string, i: number) => (
              <p key={i} className="text-pretty">
                {para}
              </p>
            ))}
        </div>

        {paper.pdfUrl && (
          <PdfPreview
            url={paper.pdfUrl}
            title={paper.title}
            onDownload={handlePdfDownload}
          />
        )}
      </article>

      <div className="flex-1" />
      <SiteFooter />
    </div>
  );
}

function PdfPreview({
  url,
  title,
  onDownload,
}: {
  url: string;
  title: string;
  onDownload: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const ctrl = new AbortController();
    fetch(url, { method: "HEAD", signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) setError(`PDF non disponibile (HTTP ${res.status}).`);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError("Impossibile caricare il PDF.");
      });
    const timer = window.setTimeout(() => setLoading(false), 8000);
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [url]);

  const handleFullscreen = () => {
    onDownload();
    window.open(url, "_blank", "noopener,noreferrer");
  };


  return (
    <section className="mt-16 pt-10 border-t border-border">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <h2 className="font-display text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Anteprima PDF
        </h2>
        <div className="flex flex-wrap gap-2 font-display text-[11px] font-bold uppercase tracking-wider">
          <button
            type="button"
            onClick={handleFullscreen}
            className="px-3 py-2 border border-border hover:border-foreground transition-colors"
          >
            Schermo intero ↗
          </button>
        </div>
      </div>

      <div className="relative w-full h-[80vh] min-h-[480px] border border-border bg-muted">
        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div
              className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin"
              aria-label="Caricamento PDF"
            />
            <p className="font-mono text-[10px] uppercase tracking-widest">
              Caricamento PDF…
            </p>
          </div>
        )}
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="font-display text-sm text-foreground">{error}</p>
            <p className="text-xs text-muted-foreground max-w-prose">
              Il viewer inline non è disponibile. Puoi comunque aprire o
              scaricare il file con i pulsanti qui sopra.
            </p>
          </div>
        ) : (
          <iframe
            key={url}
            src={`${url}#view=FitH`}
            title={`Anteprima PDF di ${title}`}
            className="w-full h-full"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError("Errore durante il caricamento del PDF.");
            }}
          />
        )}
      </div>
    </section>
  );
}
