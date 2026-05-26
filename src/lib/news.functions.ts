import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const DEFAULT_NEWS_URL =
  "https://script.google.com/macros/s/AKfycbyS4MxYpizImm4c2KaO4JuvSCjKQyHRtwFw5lSqWuuy8pCQf01yLyfpv-zVcCJMnyRkiQ/exec";


const MAX_DISPLAYED = 10;

export interface NewsItem {
  url: string;
  title: string;
  source: string | null;
  snippet: string | null;
  image: string | null;
  published_at: string;
  first_seen_at: string;
}

interface ExternalNewsItem {
  data?: string;
  titolo?: string;
  fonte?: string;
  url?: string;
  snippet?: string;
  immagine?: string;
}

function parseDate(v: unknown): string {
  if (typeof v === "string" && v.trim()) {
    const d = new Date(v);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

async function syncFromSource(): Promise<void> {
  try {
    const res = await fetch(NEWS_URL, { headers: { Accept: "application/json" } });
    if (!res.ok) return;
    const raw = (await res.json()) as unknown;
    if (!Array.isArray(raw)) return;

    const items = (raw as ExternalNewsItem[])
      .filter((it) => it && typeof it.url === "string" && it.url.trim() && typeof it.titolo === "string")
      .map((it) => ({
        url: it.url!.trim(),
        title: it.titolo!.trim(),
        source: it.fonte?.trim() || null,
        snippet: it.snippet?.trim() || null,
        image: it.immagine?.trim() || null,
        published_at: parseDate(it.data),
      }));

    if (items.length === 0) return;

    // Upsert by url; ignore conflicts on existing rows (don't overwrite first_seen_at)
    await supabaseAdmin
      .from("news_archive")
      .upsert(items, { onConflict: "url", ignoreDuplicates: true });
  } catch {
    // swallow — we still return whatever is in the archive
  }
}

export const getLatestNews = createServerFn({ method: "GET" }).handler(async () => {
  await syncFromSource();
  const { data, error } = await supabaseAdmin
    .from("news_archive")
    .select("url,title,source,snippet,image,published_at,first_seen_at")
    .order("published_at", { ascending: false })
    .limit(MAX_DISPLAYED);
  if (error) return { items: [] as NewsItem[], error: error.message };
  return { items: (data ?? []) as NewsItem[], error: null };
});

export interface ArchivedNewsItem {
  url: string;
  title: string;
  source: string | null;
  published_at: string;
  first_seen_at: string;
}

export const getNewsArchive = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin");
    if (!roles || roles.length === 0) {
      throw new Error("Forbidden");
    }
    const { data, error } = await supabaseAdmin
      .from("news_archive")
      .select("url,title,source,published_at,first_seen_at")
      .order("first_seen_at", { ascending: false })
      .limit(1000);
    if (error) return { items: [] as ArchivedNewsItem[], error: error.message };
    return { items: (data ?? []) as ArchivedNewsItem[], error: null };
  });
