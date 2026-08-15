import { Link } from "@tanstack/react-router";
import type { Paper } from "@/data/papers";
import { formatDate } from "@/data/papers";
import { useT } from "@/lib/i18n";
import { useLanguage } from "@/hooks/use-language";
import { useTranslated } from "@/hooks/use-translated";
import { LanguageFlags } from "@/components/Flag";

export function PaperRow({ paper }: { paper: Paper }) {
  const t = useT();
  const { lang } = useLanguage();
  const [title, abstract] = useTranslated([paper.title, paper.abstract]);
  const langLabel =
    paper.language === "it"
      ? t("lang.it")
      : paper.language === "en"
        ? t("lang.en")
        : t("lang.both");
  return (
    <article className="group relative bg-background p-6 md:p-8 md:grid md:grid-cols-[200px_1fr] gap-12 transition-colors hover:bg-surface">
      <span
        className="absolute top-4 right-4 md:top-6 md:right-6 leading-none select-none"
        title={langLabel}
        aria-label={`${t("paper.languageLabel")}: ${langLabel}`}
      >
        <LanguageFlags language={paper.language} className="inline-block w-5 md:w-6 h-auto align-middle" />
      </span>
      <div className="font-mono text-xs text-muted-foreground mb-4 md:mb-0">
        <div className="mb-1 uppercase">{formatDate(paper.publishedDate, lang)}</div>
        <div className="text-primary uppercase tracking-tighter">
          {paper.tags.map((tag) => `#${tag}`).join(" ")}
        </div>
      </div>
      <div>
        <Link to="/paper/$slug" params={{ slug: paper.slug }} className="block">
          <h3 className="text-2xl font-display font-bold tracking-tight mb-4 group-hover:text-primary transition-colors text-balance pr-16">
            {title}
          </h3>
        </Link>
        <p className="text-muted-foreground max-w-[65ch] mb-8 leading-relaxed text-justify line-clamp-3">
          {abstract}
        </p>
        <div className="flex flex-wrap gap-3 font-display text-[11px] font-bold uppercase tracking-wider">
          <Link
            to="/paper/$slug"
            params={{ slug: paper.slug }}
            className="px-4 py-2 bg-foreground text-background hover:bg-primary transition-colors"
          >
            {t("paper.readOnline")}
          </Link>
          {paper.pdfUrl && (
            <Link
              to="/paper/$slug"
              params={{ slug: paper.slug }}
              hash="pdf-reader"
              className="px-4 py-2 border border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              {t("paper.pdf")}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
