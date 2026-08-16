import { Link } from "@tanstack/react-router";
import type { Paper } from "@/data/papers";
import { formatDate } from "@/data/papers";
import { useT } from "@/lib/i18n";
import { useLanguage } from "@/hooks/use-language";
import { useTranslated } from "@/hooks/use-translated";
import { LanguageFlags } from "@/components/Flag";
import { estimateReadingMinutes } from "@/lib/paper-reading";

const ACCENT = "var(--card-accent, var(--primary))";


function truncate(text: string, max = 160) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : max).trimEnd()}…`;
}

export function PaperRow({ paper }: { paper: Paper }) {
  const t = useT();
  const { lang } = useLanguage();
  const [title, abstract] = useTranslated([paper.title, paper.abstract]);
  const minutes = estimateReadingMinutes(paper.content || paper.abstract);
  const langLabel =
    paper.language === "it"
      ? t("lang.it")
      : paper.language === "en"
        ? t("lang.en")
        : t("lang.both");
  return (
    <article className="group relative bg-background p-6 md:p-8 flex flex-col transition-colors hover:bg-surface">
      {/* Linea elegante da margine a margine */}
      <span
        aria-hidden="true"
        className="block h-[3px] w-full rounded-full mb-4"
        style={{ background: ACCENT }}
      />

      <span
        className="absolute top-8 right-6 md:top-10 md:right-8 leading-none select-none"
        title={langLabel}
        aria-label={`${t("paper.languageLabel")}: ${langLabel}`}
      >
        <LanguageFlags language={paper.language} className="inline-block w-5 md:w-6 h-auto align-middle" />
      </span>

      <div className="font-mono text-xs text-muted-foreground uppercase whitespace-nowrap pr-16">
        {formatDate(paper.publishedDate, lang)}
      </div>
      <div className="font-mono text-xs text-primary uppercase tracking-tighter mt-1 mb-5">
        {paper.tags.map((tag) => `#${tag}`).join(" ")}
      </div>

      <div className="flex-1">
        <Link to="/paper/$slug" params={{ slug: paper.slug }} className="block">
          <h3 className="text-2xl font-display font-bold tracking-tight mb-4 group-hover:text-primary transition-colors text-balance pr-16">
            {title}
          </h3>
        </Link>
        <p className="text-muted-foreground max-w-[65ch] mb-3 leading-relaxed text-justify">
          {truncate(abstract)}
        </p>
        <Link
          to="/paper/$slug"
          params={{ slug: paper.slug }}
          className="inline-block mb-6 font-display text-[11px] font-bold uppercase tracking-wider text-primary hover:underline"
        >
          {t("paper.readMore")}
        </Link>
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

      <div className="mt-6 font-mono text-xs text-muted-foreground text-left">
        {t("paper.readingTime", minutes)}
      </div>
    </article>
  );

}
