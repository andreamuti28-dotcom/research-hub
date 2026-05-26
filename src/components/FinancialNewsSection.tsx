import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface NewsItem {
  data: string;
  titolo: string;
  fonte: string;
  url: string;
  snippet: string;
  immagine: string;
}

const NEWS_URL =
  "https://script.google.com/macros/s/AKfycbyS4MxYpizImm4c2KaO4JuvSCjKQyHRtwFw5lSqWuuy8pCQf01yLyfpv-zVcCJMnyRkiQ/exec";

async function fetchNews(): Promise<NewsItem[]> {
  const res = await fetch(NEWS_URL);
  if (!res.ok) throw new Error("Errore nel caricamento delle news");
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export function FinancialNewsSection() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["financial-news"],
    queryFn: fetchNews,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

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
              Live
            </span>
            <h2 className="text-xl md:text-2xl font-display font-bold tracking-tighter italic group-hover:text-primary leading-tight transition-colors">
              News Finanziarie
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
            {isLoading || isFetching && !data ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="border border-border bg-surface animate-pulse"
                  >
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
                  Impossibile caricare le news.
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="inline-flex items-center px-4 py-2 border border-foreground text-foreground font-display text-[11px] font-bold uppercase tracking-wider hover:bg-foreground hover:text-background transition-colors"
                >
                  Riprova
                </button>
              </div>
            ) : !data || data.length === 0 ? (
              <div className="border border-border p-10 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground bg-surface">
                Nessuna news disponibile.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.map((item, idx) => (
                  <a
                    key={`${item.url}-${idx}`}
                    href={item.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="group flex flex-col border border-border bg-surface hover:border-foreground transition-colors overflow-hidden"
                  >
                    {item.immagine ? (
                      <div className="aspect-[16/9] bg-muted overflow-hidden">
                        <img
                          src={item.immagine}
                          alt={item.titolo}
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
                        <span className="truncate">{item.fonte}</span>
                        {item.data && (
                          <time className="shrink-0">
                            {new Date(item.data).toLocaleDateString("it-IT", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </time>
                        )}
                      </div>
                      <h3 className="font-display font-bold tracking-tight leading-snug text-base group-hover:text-primary transition-colors line-clamp-3">
                        {item.titolo}
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
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
