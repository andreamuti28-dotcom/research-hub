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

export type SiteSettings = {
  name: string;
  heroTitle: string;
  heroIntro: string;
  linkedinUrl: string;
  portraitUrl: string | null;
  featuredPaperIds: string[];
};

const DEFAULTS: SiteSettings = {
  name: "Andrea Muti",
  heroTitle:
    "Esplorando l'intersezione tra Etica Digitale e Infrastrutture.",
  heroIntro:
    "Sono un ricercatore indipendente basato a Milano. Mi occupo di come le architetture software influenzano il comportamento sociale. Questo spazio è il mio archivio di paper, saggi e riflessioni tecniche.",
  linkedinUrl: "https://www.linkedin.com",
  portraitUrl: null,
  featuredPaperIds: [],
};

export const getSiteSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteSettings> => {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("name, hero_title, hero_intro, linkedin_url, portrait_url, featured_paper_ids")
      .eq("singleton", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return DEFAULTS;
    const raw = (data as { featured_paper_ids?: string[] | null }).featured_paper_ids;
    return {
      name: data.name ?? DEFAULTS.name,
      heroTitle: data.hero_title ?? DEFAULTS.heroTitle,
      heroIntro: data.hero_intro ?? DEFAULTS.heroIntro,
      linkedinUrl: data.linkedin_url ?? DEFAULTS.linkedinUrl,
      portraitUrl: data.portrait_url ?? null,
      featuredPaperIds: Array.isArray(raw) ? raw.slice(0, 3) : [],
    };
  },
);

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  heroTitle: z.string().trim().min(1).max(500),
  heroIntro: z.string().trim().min(1).max(2000),
  linkedinUrl: z.string().trim().url().max(500),
  portraitUrl: z.string().trim().url().max(1000).nullable().optional(),
  featuredPaperIds: z.array(z.string().uuid()).max(3).default([]),
});

export const updateSiteSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: existing } = await supabaseAdmin
      .from("site_settings")
      .select("id")
      .eq("singleton", true)
      .maybeSingle();

    const payload = {
      name: data.name,
      hero_title: data.heroTitle,
      hero_intro: data.heroIntro,
      linkedin_url: data.linkedinUrl,
      portrait_url: data.portraitUrl ?? null,
      featured_paper_ids: data.featuredPaperIds,
    };

    if (existing) {
      const { error } = await supabaseAdmin
        .from("site_settings")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("site_settings")
        .insert({ singleton: true, ...payload });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

const uploadPortraitSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.literal("image/jpeg"),
  base64: z.string().min(1),
});

export const uploadSitePortrait = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => uploadPortraitSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const encoded = data.base64.includes(",")
      ? data.base64.split(",").pop()
      : data.base64;
    if (!encoded) throw new Error("Immagine non valida.");

    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const safeName =
      data.fileName
        .toLowerCase()
        .replace(/\.[a-z0-9]+$/i, "")
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "") || "homepage-photo";
    const path = `homepage/${Date.now()}-${safeName}.jpg`;

    const { error } = await supabaseAdmin.storage
      .from("site-assets")
      .upload(path, bytes.buffer, {
        contentType: data.mimeType,
        upsert: false,
      });
    if (error) throw new Error(error.message);

    const { data: publicData } = supabaseAdmin.storage
      .from("site-assets")
      .getPublicUrl(path);

    return { publicUrl: `${publicData.publicUrl}?v=${Date.now()}` };
  });
