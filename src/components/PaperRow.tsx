import { Link } from "@tanstack/react-router";
import type { Paper } from "@/data/papers";
import { formatDate, pickPdfUrl } from "@/data/papers";
import { useT } from "@/lib/i18n";
import { useLanguage } from "@/hooks/use-language";
import { useTranslated } from "@/hooks/use-translated";
import { LanguageFlags } from "@/components/Flag";
import { estimateReadingMinutes } from "@/lib/paper-reading";
import { tagAccentColor } from "@/lib/paper-tags";

function truncate(text: string, max = 190) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : max).trimEnd()}…`;
}

export function PaperRow({ paper }: { paper: Paper }) {
  const t = useT();
  const { lang } = useLanguage();
  const [title, abstract] = useTranslated([paper.title, paper.abstract]);
  const accent = tagAccentColor(paper.tags ?? []);
  const minutes = estimateReadingMinutes(paper.content || paper.abstract);
  const langLabel =
    paper.language === "it"
      ? t("lang.it")
      : paper.language === "en"
        ? t("lang.en")
        : t("lang.both");
  return (
    <article className="group flex flex-wrap gap-x-12 gap-y-3 py-5 border-b border-border">
      <div className="basis-36 shrink-0 pt-1 flex sm:flex-col items-center sm:items-start gap-3 text-sm text-muted-foreground font-display">
        <span>{formatDate(paper.publishedDate, lang)}</span>
        <span title={langLabel} aria-label={`${t("paper.languageLabel")}: ${langLabel}`}>
          <LanguageFlags
            language={paper.language}
            className="inline-block w-5 h-auto align-middle"
          />
        </span>
      </div>

      <div className="flex-[999_1_480px] min-w-0">
        <h3 className="font-editorial text-[1.25rem] leading-tight font-medium text-balance">
          <Link
            to="/paper/$slug"
            params={{ slug: paper.slug }}
            className="text-foreground hover:text-primary transition-colors"
          >
            {title}
          </Link>
        </h3>
        <p className="mt-2.5 text-base leading-relaxed text-muted-foreground max-w-[72ch] font-display">
          {truncate(abstract)}
        </p>
      </div>

      <div className="basis-48 shrink-0 flex flex-col gap-2 text-sm font-display text-muted-foreground">
        <span className="inline-flex items-center gap-2 font-semibold text-primary">
          <span
            aria-hidden="true"
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: accent }}
          />
          {paper.tags.join(" · ")}
        </span>
        <span>{t("paper.readingTime", minutes)}</span>
        <span className="flex gap-3">
          <Link
            to="/paper/$slug"
            params={{ slug: paper.slug }}
            className="font-semibold text-primary hover:underline underline-offset-4"
          >
            {t("paper.readOnline")}
          </Link>
          {pickPdfUrl(paper, lang) && (
            <Link
              to="/paper/$slug"
              params={{ slug: paper.slug }}
              hash="pdf-reader"
              className="font-semibold text-primary hover:underline underline-offset-4"
            >
              {t("paper.pdf")}
            </Link>
          )}
        </span>
      </div>
    </article>
  );
}
