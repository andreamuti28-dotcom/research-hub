import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import "katex/dist/katex.min.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PdfCanvasViewer } from "@/components/PdfCanvasViewer";
import { formatDateShort } from "@/data/papers";
import { getPublishedPaperBySlug } from "@/lib/papers.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  parseContent,
  renderMathHtml,
  estimateReadingMinutes,
} from "@/lib/paper-reading";
import { useT } from "@/lib/i18n";
import { useLanguage } from "@/hooks/use-language";
import { useTranslated } from "@/hooks/use-translated";


export const Route = createFileRoute("/paper/$slug")({
  loader: async ({ params }) => {
    const paper = await getPublishedPaperBySlug({ data: { slug: params.slug } });
    if (!paper) throw notFound();
    return { paper };
  },
  head: ({ params, loaderData }) => {
    const paper = loaderData?.paper;
    const url = `https://www.andreamuti.com/paper/${params.slug}`;
    if (!paper) {
      return {
        meta: [
          { title: "Paper non trovato — Andrea Muti" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    return {
      meta: [
        { title: `${paper.title} — Andrea Muti` },
        { name: "description", content: paper.abstract },
        { property: "og:title", content: paper.title },
        { property: "og:description", content: paper.abstract },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "article:published_time", content: paper.publishedDate },
        { property: "article:author", content: "Andrea Muti" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: paper.title },
        { name: "twitter:description", content: paper.abstract },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: paper.title,
            description: paper.abstract,
            datePublished: paper.publishedDate,
            author: { "@type": "Person", name: "Andrea Muti", url: "https://www.andreamuti.com/about" },
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
            inLanguage: paper.language ?? "it",
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.andreamuti.com/" },
              { "@type": "ListItem", position: 2, name: "Archivio", item: "https://www.andreamuti.com/archivio" },
              { "@type": "ListItem", position: 3, name: paper.title, item: url },
            ],
          }),
        },
      ],
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
  const { lang } = useLanguage();

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
            <span>{formatDateShort(paper.publishedDate, lang)}</span>
            <span className="text-border">/</span>
            <span>{t("paper.readingMin", readingMinutes)}</span>
            <span className="text-border">/</span>
            <span className="text-primary uppercase tracking-tighter">
              {paper.tags.map((tg: string) => `#${tg}`).join(" ")}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tighter leading-[1.05] text-balance italic mb-8">
            {tTitle}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed text-pretty text-justify max-w-[60ch]">
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
                  className="text-pretty text-justify"
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
  t,
}: {
  url: string;
  title: string;
  t: ReturnType<typeof useT>;
}) {
  return (
    <section id="pdf-reader" className="mt-16 pt-10 border-t border-border scroll-mt-24">
      <h2 className="font-display text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
        {t("paper.pdfHeading")}
      </h2>
      <PdfCanvasViewer url={url} />
    </section>
  );
}

