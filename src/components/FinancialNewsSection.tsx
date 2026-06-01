import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getLatestNews, type NewsItem } from "@/lib/news.functions";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useT } from "@/lib/i18n";
import { useTranslated } from "@/hooks/use-translated";

const COUNTDOWN_MS = 5000;

export function FinancialNewsSection() {
  const [open, setOpen] = useState(false);
  const settings = useSiteSettings();
  const fetchNews = useServerFn(getLatestNews);
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["financial-news"],
    queryFn: async () => {
      const reqTs = Date.now();
      console.log(`[news-client ${reqTs}] requesting`);
      const result = await fetchNews();
      const resTs = Date.now();
      const count = result?.items?.length ?? 0;
      console.log(`[news-client ${resTs}] received ${count} items (${resTs - reqTs}ms)`);
      return result;
    },
    enabled: true,
    staleTime: 0,
    gcTime: 0,
    refetchInterval: 15000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const items: NewsItem[] = data?.items ?? [];
  const t = useT();
  // Translate news titles + snippets in order; cache keyed by content.
  const translatable = useMemo(() => {
    const arr: string[] = [];
    for (const it of items) {
      arr.push(it.title ?? "");
      arr.push(it.snippet ?? "");
    }
    return arr;
  }, [items]);
  const translated = useTranslated(translatable);

  // Countdown bar on expand
  const [countdown, setCountdown] = useState(0); // 0 -> 100
  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!open) {
      setCountdown(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const pct = Math.min(100, ((now - start) / COUNTDOWN_MS) * 100);
      setCountdown(pct);
      if (pct < 100) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [open]);

  const barColor = settings.newsCountdownColor || "#9ca3af";

  return (
    <section className="border-t border-border bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="group w-full flex items-center justify-between gap-6 py-7 md:py-9 text-left transition-colors"
        >
          <div className="flex items-center gap-4 min-w-0">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-primary/10 text-primary shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              {t("news.live")}
            </span>
            <h2 className="text-xl md:text-2xl font-display font-bold tracking-tighter italic group-hover:text-primary leading-tight transition-colors">
              {t("news.title")}
            </h2>
          </div>
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-border transition-all group-hover:border-primary group-hover:text-primary shrink-0"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            aria-hidden
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </button>

        {open && (
          <div className="pb-10 md:pb-14 animate-fade-up">
            {/* 5s countdown bar */}
            <div
              className="h-1 w-full bg-muted overflow-hidden mb-6"
              aria-hidden
            >
              <div
                className="h-full transition-[width] ease-linear"
                style={{
                  width: `${countdown}%`,
                  backgroundColor: barColor,
                }}
              />
            </div>

            {(isLoading || (isFetching && items.length === 0)) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border border-border bg-surface animate-pulse">
                    <div className="aspect-[16/9] bg-muted" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : isError ? (
              <div className="border border-border p-10 text-center bg-surface">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-4">
                  {t("news.error")}
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex items-center px-4 py-2 border border-foreground text-foreground font-display text-[11px] font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors"
                >
                  {t("news.retry")}
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="border border-border p-10 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground bg-surface">
                {t("news.empty")}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item) => {
                  const seen = new Date(item.first_seen_at);
                  return (
                    <a
                      key={item.url}
                      href={item.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group flex flex-col border border-border bg-surface hover:border-foreground transition-colors overflow-hidden"
                    >
                      {item.image ? (
                        <div className="aspect-[16/9] bg-muted overflow-hidden">
                          <img
                            src={item.image}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="aspect-[16/9] bg-muted" />
                      )}
                      <div className="p-4 flex flex-col flex-1 gap-3">
                        <div className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                          <span className="truncate">{item.source ?? ""}</span>
                          <time className="shrink-0 tabular-nums" dateTime={item.first_seen_at}>
                            {seen.toLocaleDateString("it-IT", { day: "2-digit", month: "short" })}
                            {" · "}
                            {seen.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                          </time>
                        </div>
                        <h3 className="font-display font-bold tracking-tight leading-snug text-base group-hover:text-primary transition-colors line-clamp-3">
                          {item.title}
                        </h3>
                        {item.snippet && (
                          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                            {item.snippet}
                          </p>
                        )}
                        <span className="mt-auto pt-2 font-display text-[11px] font-bold uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">
                          Leggi la fonte ↗
                        </span>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
