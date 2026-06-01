import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

const paperInputSchema = z.object({
  slug: z.preprocess(
    (val) =>
      typeof val === "string"
        ? val
            .trim()
            .toLowerCase()
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
        : val,
    z
      .string()
      .min(1, "Slug obbligatorio")
      .max(120)
      .regex(/^[a-z0-9-]+$/, "Solo minuscole, numeri e trattini"),
  ),
  title: z.string().trim().min(1, "Titolo obbligatorio").max(300),
  abstract: z.string().trim().min(1, "Abstract obbligatorio").max(1000),
  content: z.string().max(100_000).default(""),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  pdfUrl: z
    .string()
    .trim()
    .url("URL non valido")
    .max(500)
    .nullable()
    .optional(),
  publishedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data non valida (YYYY-MM-DD)"),
  publishAt: z
    .string()
    .trim()
    .min(1)
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? new Date(v).toISOString() : null)),
  isPublished: z.boolean().default(true),
  language: z.enum(["it", "en", "both"]).default("it"),
});

export const checkAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });

export const listAllPapers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("papers")
      .select("*")
      .order("published_date", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getPaperForEdit = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: row, error } = await supabaseAdmin
      .from("papers")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const createPaper = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => paperInputSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: row, error } = await supabaseAdmin
      .from("papers")
      .insert({
        slug: data.slug,
        title: data.title,
        abstract: data.abstract,
        content: data.content,
        tags: data.tags,
        pdf_url: data.pdfUrl ?? null,
        published_date: data.publishedDate,
        publish_at: data.publishAt ?? null,
        is_published: data.isPublished,
        language: data.language,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updatePaper = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    paperInputSchema.extend({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { id, ...rest } = data;
    const { data: row, error } = await supabaseAdmin
      .from("papers")
      .update({
        slug: rest.slug,
        title: rest.title,
        abstract: rest.abstract,
        content: rest.content,
        tags: rest.tags,
        pdf_url: rest.pdfUrl ?? null,
        published_date: rest.publishedDate,
        publish_at: rest.publishAt ?? null,
        is_published: rest.isPublished,
        language: rest.language,
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deletePaper = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("papers")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
