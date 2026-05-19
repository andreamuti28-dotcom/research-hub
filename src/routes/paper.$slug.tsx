import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import "katex/dist/katex.min.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { formatDateShort } from "@/data/papers";
import { getPublishedPaperBySlug } from "@/lib/papers.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  parseContent,
  renderMathHtml,
  estimateReadingMinutes,
} from "@/lib/paper-reading";
import { useT } from "@/lib/i18n";
import { useTranslated } from "@/hooks/use-translated";


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
  const t = useT();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 max-w-3xl mx-auto px-6 py-32 text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          404
        </div>
        <h1 className="text-3xl font-display font-bold tracking-tighter italic mb-6">
          {t("paper.notFound")}
        </h1>
        <Link
          to="/archivio"
          className="inline-block px-4 py-2 bg-foreground text-background font-display text-[11px] font-bold uppercase tracking-wider hover:bg-primary transition-colors"
        >
          {t("paper.backToArchive")}
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}

function PaperDetail() {
  const { paper } = Route.useLoaderData();
  const t = useT();

  useEffect(() => {
    void supabase.rpc("increment_paper_views", { _slug: paper.slug });
  }, [paper.slug]);

  const [tTitle, tAbstract, tContent] = useTranslated([
    paper.title,
    paper.abstract,
    paper.content,
  ]);

  const { blocks, toc } = useMemo(
    () => parseContent(tContent),
    [tContent],
  );
  const readingMinutes = useMemo(
    () => estimateReadingMinutes(tContent),
    [tContent],
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <article className="max-w-6xl mx-auto px-6 py-16 md:py-24 w-full">
        <Link
          to="/archivio"
          className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-12 inline-block"
        >
          {t("paper.back")}
        </Link>

        <header className="mb-12 animate-fade-up max-w-3xl">
          <div className="font-mono text-xs text-muted-foreground mb-6 flex flex-wrap items-center gap-3">
            <span>{formatDateShort(paper.publishedDate)}</span>
            <span className="text-border">/</span>
            <span>{t("paper.readingMin", readingMinutes)}</span>
            <span className="text-border">/</span>
            <span>{t("paper.views", paper.views)}</span>
            <span className="text-border">/</span>
            <span className="text-primary uppercase tracking-tighter">
              {paper.tags.map((tg: string) => `#${tg}`).join(" ")}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tighter leading-[1.05] text-balance italic mb-8">
            {tTitle}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed text-pretty max-w-[60ch]">
            {tAbstract}
          </p>
        </header>

        <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-12">
          <div className="space-y-6 text-lg leading-[1.75] text-foreground/90 max-w-[68ch]">
            {blocks.map((block, i) =>
              block.type === "h2" ? (
                <h2
                  key={i}
                  id={block.id}
                  className="text-2xl md:text-3xl font-display font-bold tracking-tight italic pt-6 scroll-mt-24"
                >
                  {block.text}
                </h2>
              ) : (
                <p
                  key={i}
                  className="text-pretty"
                  dangerouslySetInnerHTML={{ __html: renderMathHtml(block.text) }}
                />
              ),
            )}
          </div>

          {toc.length > 0 && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
                  {t("paper.toc")}
                </div>
                <nav className="space-y-2 border-l border-border pl-4">
                  {toc.map((entry) => (
                    <a
                      key={entry.id}
                      href={`#${entry.id}`}
                      className="block text-sm text-muted-foreground hover:text-foreground transition-colors leading-snug"
                    >
                      {entry.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>

        {paper.pdfUrl && (
          <PdfPreview url={paper.pdfUrl} title={paper.title} t={t} />
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
  t,
}: {
  url: string;
  title: string;
  t: ReturnType<typeof useT>;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const ctrl = new AbortController();
    fetch(url, { method: "HEAD", signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) setError(t("paper.pdfUnavailable", res.status));
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(t("paper.pdfLoadError"));
      });
    const timer = window.setTimeout(() => setLoading(false), 8000);
    return () => {
      ctrl.abort();
      window.clearTimeout(timer);
    };
  }, [url, t]);

  return (
    <section className="mt-16 pt-10 border-t border-border">
      <h2 className="font-display text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
        {t("paper.pdfHeading")}
      </h2>

      <div
        className="relative w-full h-[80vh] min-h-[480px] border border-border bg-muted"
        onContextMenu={(e) => e.preventDefault()}
      >
        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div
              className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin"
              aria-label={t("paper.pdfLoading")}
            />
            <p className="font-mono text-[10px] uppercase tracking-widest">
              {t("paper.pdfLoading")}
            </p>
          </div>
        )}
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <p className="font-display text-sm text-foreground">{error}</p>
          </div>
        ) : (
          <iframe
            key={url}
            src={`${url}#toolbar=0&navpanes=0&view=FitH`}
            title={title}
            className="w-full h-full"
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(t("paper.pdfRenderError"));
            }}
          />
        )}
      </div>
    </section>
  );
}

