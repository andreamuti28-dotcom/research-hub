import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Paper } from "@/data/papers";

function mapPaper(row: {
  id: string;
  slug: string;
  title: string;
  abstract: string;
  content: string;
  tags: string[];
  pdf_url: string | null;
  published_date: string;
  is_published: boolean;
  views: number;
  downloads: number;
}): Paper {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    abstract: row.abstract,
    content: row.content,
    tags: row.tags ?? [],
    pdfUrl: row.pdf_url,
    publishedDate: row.published_date,
    isPublished: row.is_published,
    views: row.views,
    downloads: row.downloads,
  };
}

export const listPublishedPapers = createServerFn({ method: "GET" }).handler(
  async () => {
    const { data, error } = await supabaseAdmin
      .from("papers")
      .select(
        "id, slug, title, abstract, content, tags, pdf_url, published_date, is_published, views, downloads",
      )
      .eq("is_published", true)
      .order("published_date", { ascending: false });

    if (error) throw new Error(error.message);
    return (data ?? []).map(mapPaper);
  },
);

export const getPublishedPaperBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("papers")
      .select(
        "id, slug, title, abstract, content, tags, pdf_url, published_date, is_published, views, downloads",
      )
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return row ? mapPaper(row) : null;
  });
