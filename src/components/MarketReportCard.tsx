import * as Dialog from "@radix-ui/react-dialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X } from "lucide-react";
import { useT } from "@/lib/i18n";

/** First real paragraph of the report, as plain text, for the teaser. */
function excerptOf(markdown: string) {
  const blocks = markdown
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b && !b.startsWith("#") && !/^[-*]\s/.test(b));
  const para = blocks.find((b) => b.length > 120) ?? blocks[0] ?? "";
  return para
    .replace(/\\([&\-*_#])/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function MarketReportCard({
  date,
  content,
  disclaimer,
  className = "",
}: {
  date: string;
  content: string;
  disclaimer?: string;
  className?: string;
}) {
  const t = useT();
  // The report opens with "# headline" and often an italic standfirst: the
  // headline becomes the card title, the standfirst its teaser.
  const headlineMatch = content.match(/^\s*#\s+([^\n]+)\n+/);
  // A headline that swallowed the "SOMMARIO:" label is split back in two.
  const [headlineRaw, inlineStandfirst] = (headlineMatch ? headlineMatch[1] : "").split(
    /\s+SOMMARIO\s*:\s*/i,
  );
  const headline = (headlineRaw ?? "").replace(/^TITOLO\s*:\s*/i, "").trim();
  const body = headlineMatch ? content.slice(headlineMatch[0].length) : content;
  const standfirst = body.match(/^\s*[*_]([^*_\n]{20,})[*_]\s*(\n|$)/);
  const excerpt = inlineStandfirst?.trim() || (standfirst ? standfirst[1].trim() : excerptOf(body));
  const title = headline || t("home.report.title");

  return (
    <div className={`bg-sage rounded-xl p-6 flex flex-col ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-primary font-display">
          {t("home.report.kicker")}
        </p>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-primary font-display">
          <span className="relative flex w-2 h-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-600" />
          </span>
          {date}
        </span>
      </div>
      <h3 className="mt-3.5 font-editorial text-xl font-medium leading-tight line-clamp-3">
        {title}
      </h3>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground font-display line-clamp-6">
        {excerpt}
      </p>

      <Dialog.Root>
        <Dialog.Trigger asChild>
          <button
            type="button"
            className="am-btn self-start mt-5 h-11 px-5 rounded-md bg-brand text-brand-fg font-display text-sm font-semibold"
          >
            {t("home.report.open")}
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="am-dialog-overlay fixed inset-0 z-[60] bg-black/55 overflow-y-auto">
            <Dialog.Content
              className="am-dialog relative mx-auto my-6 sm:my-16 w-[min(880px,calc(100%-24px))] rounded-2xl bg-background text-foreground shadow-2xl focus:outline-none"
              aria-describedby={undefined}
            >
              <div className="flex items-start justify-between gap-4 px-6 sm:px-10 pt-6 pb-5 border-b border-border">
                <div>
                  <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-primary font-display">
                    {t("home.report.kicker")} · {date}
                  </p>
                  <Dialog.Title className="mt-2 font-editorial text-2xl sm:text-[28px] font-medium leading-tight">
                    {title}
                  </Dialog.Title>
                </div>
                <Dialog.Close
                  aria-label={t("home.report.close")}
                  className="am-btn shrink-0 w-11 h-11 rounded-full border border-border flex items-center justify-center hover:border-foreground"
                >
                  <X className="w-4 h-4" aria-hidden />
                </Dialog.Close>
              </div>
              <div className="px-6 sm:px-10 pt-6 pb-10">
                <div className="market-report-prose text-foreground" style={{ maxWidth: "none" }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
                </div>
                {disclaimer && disclaimer.trim() && (
                  <p className="mt-8 text-xs text-muted-foreground font-display">{disclaimer}</p>
                )}
                <Dialog.Close className="am-btn mt-8 h-11 px-5 rounded-md border border-brand text-brand dark:border-primary dark:text-primary font-display text-sm font-semibold">
                  {t("home.report.close")}
                </Dialog.Close>
              </div>
            </Dialog.Content>
          </Dialog.Overlay>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
