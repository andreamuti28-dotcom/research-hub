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

export type LanguageItem = {
  name: string;
  level: number;
  flag: string;
  flagUrl: string | null;
  description: string;
};
export type LogoItem = { name: string; logoUrl: string | null; description: string };
export type EducationItem = { name: string; detail: string; description: string };
export type HobbyItem = { name: string; icon: string };

export type SiteSettings = {
  name: string;
  heroTitle: string;
  heroIntro: string;
  linkedinUrl: string;
  portraitUrl: string | null;
  featuredPaperIds: string[];
  homeFeaturedLabel: string;
  homeMarketLabel: string;
  homeMarketEnabled: boolean;
  aboutRole: string;
  aboutBio: string;
  aboutKicker: string;
  aboutEducationLabel: string;
  aboutLanguagesLabel: string;
  aboutSoftwareLabel: string;
  aboutCertificationsLabel: string;
  aboutPanelBg: string;
  aboutPanelFg: string;
  aboutLanguagesBarColor: string;
  aboutLanguagesBarTrackColor: string;
  aboutLogoMaxWidth: number;
  aboutPortraitPosX: number;
  aboutPortraitPosY: number;
  aboutTooltipBg: string;
  aboutTooltipFg: string;
  aboutTooltipBorder: string;
  aboutEducation: EducationItem[];
  aboutLanguages: LanguageItem[];
  aboutSoftware: LogoItem[];
  aboutCertifications: LogoItem[];
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
  homeFeaturedLabel: "Paper in Evidenza",
  homeMarketLabel: "Analisi Mercati Finanziari",
  homeMarketEnabled: true,
  aboutRole: "Ricercatore indipendente",
  aboutBio:
    "Ciao! Mi chiamo Andrea e sono un ricercatore indipendente.\n\nDa anni mi occupo di etica digitale e infrastrutture software.",
  aboutKicker: "Chi sono",
  aboutEducationLabel: "Formazione",
  aboutLanguagesLabel: "Lingue",
  aboutSoftwareLabel: "Software & AI",
  aboutCertificationsLabel: "Certificazioni",
  aboutPanelBg: "#1e3a8a",
  aboutPanelFg: "#ffffff",
  aboutLanguagesBarColor: "#ffffff",
  aboutLanguagesBarTrackColor: "#ffffff33",
  aboutLogoMaxWidth: 48,
  aboutPortraitPosX: 50,
  aboutPortraitPosY: 50,
  aboutTooltipBg: "#ffffff",
  aboutTooltipFg: "#000000",
  aboutTooltipBorder: "#e5e7eb",
  aboutEducation: [],
  aboutLanguages: [],
  aboutSoftware: [],
  aboutCertifications: [],
};


function coerceLanguages(v: unknown): LanguageItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((it) => {
      if (!it || typeof it !== "object") return null;
      const o = it as Record<string, unknown>;
      const name = typeof o.name === "string" ? o.name : "";
      const lvl = typeof o.level === "number" ? o.level : Number(o.level);
      const level = Number.isFinite(lvl) ? Math.max(0, Math.min(100, Math.round(lvl))) : 0;
      const flag = typeof o.flag === "string" ? o.flag : "";
      const flagUrl = typeof o.flagUrl === "string" && o.flagUrl ? o.flagUrl : null;
      const description = typeof o.description === "string" ? o.description : "";
      if (!name) return null;
      return { name, level, flag, flagUrl, description };
    })
    .filter((x): x is LanguageItem => x !== null);
}


function coerceLogos(v: unknown): LogoItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((it) => {
      if (!it || typeof it !== "object") return null;
      const o = it as Record<string, unknown>;
      const name = typeof o.name === "string" ? o.name : "";
      const logoUrl = typeof o.logoUrl === "string" && o.logoUrl ? o.logoUrl : null;
      const description = typeof o.description === "string" ? o.description : "";
      if (!name) return null;
      return { name, logoUrl, description };
    })
    .filter((x): x is LogoItem => x !== null);
}

function coerceEducation(v: unknown): EducationItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((it) => {
      if (!it || typeof it !== "object") return null;
      const o = it as Record<string, unknown>;
      const name = typeof o.name === "string" ? o.name : "";
      const detail = typeof o.detail === "string" ? o.detail : "";
      const description = typeof o.description === "string" ? o.description : "";
      if (!name) return null;
      return { name, detail, description };
    })
    .filter((x): x is EducationItem => x !== null);
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v : fallback;
}

function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export const getSiteSettings = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteSettings> => {
    const { data, error } = await supabaseAdmin
      .from("site_settings")
      .select("*")
      .eq("singleton", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return DEFAULTS;
    const raw = (data as { featured_paper_ids?: string[] | null }).featured_paper_ids;
    const d = data as Record<string, unknown>;
    return {
      name: str(d.name, DEFAULTS.name),
      heroTitle: str(d.hero_title, DEFAULTS.heroTitle),
      heroIntro: str(d.hero_intro, DEFAULTS.heroIntro),
      linkedinUrl: str(d.linkedin_url, DEFAULTS.linkedinUrl),
      portraitUrl: (d.portrait_url as string | null) ?? null,
      featuredPaperIds: Array.isArray(raw) ? raw.slice(0, 3) : [],
      homeFeaturedLabel: str(d.home_featured_label, DEFAULTS.homeFeaturedLabel),
      homeMarketLabel: str(d.home_market_label, DEFAULTS.homeMarketLabel),
      homeMarketEnabled:
        typeof d.home_market_enabled === "boolean" ? d.home_market_enabled : DEFAULTS.homeMarketEnabled,

      aboutRole: str(d.about_role, DEFAULTS.aboutRole),
      aboutBio: str(d.about_bio, DEFAULTS.aboutBio),
      aboutKicker: str(d.about_kicker, DEFAULTS.aboutKicker),
      aboutEducationLabel: str(d.about_education_label, DEFAULTS.aboutEducationLabel),
      aboutLanguagesLabel: str(d.about_languages_label, DEFAULTS.aboutLanguagesLabel),
      aboutSoftwareLabel: str(d.about_software_label, DEFAULTS.aboutSoftwareLabel),
      aboutCertificationsLabel: str(d.about_certifications_label, DEFAULTS.aboutCertificationsLabel),
      aboutPanelBg: str(d.about_panel_bg, DEFAULTS.aboutPanelBg),
      aboutPanelFg: str(d.about_panel_fg, DEFAULTS.aboutPanelFg),
      aboutLanguagesBarColor: str(d.about_languages_bar_color, DEFAULTS.aboutLanguagesBarColor),
      aboutLanguagesBarTrackColor: str(d.about_languages_bar_track_color, DEFAULTS.aboutLanguagesBarTrackColor),
      aboutLogoMaxWidth: clampInt(d.about_logo_max_width, 16, 200, DEFAULTS.aboutLogoMaxWidth),
      aboutPortraitPosX: clampInt(d.about_portrait_pos_x, 0, 100, DEFAULTS.aboutPortraitPosX),
      aboutPortraitPosY: clampInt(d.about_portrait_pos_y, 0, 100, DEFAULTS.aboutPortraitPosY),
      aboutTooltipBg: str(d.about_tooltip_bg, DEFAULTS.aboutTooltipBg),
      aboutTooltipFg: str(d.about_tooltip_fg, DEFAULTS.aboutTooltipFg),
      aboutTooltipBorder: str(d.about_tooltip_border, DEFAULTS.aboutTooltipBorder),
      aboutEducation: coerceEducation(d.about_education),
      aboutLanguages: coerceLanguages(d.about_languages),
      aboutSoftware: coerceLogos(d.about_software),
      aboutCertifications: coerceLogos(d.about_certifications),
    };
  },
);

const languageSchema = z.object({
  name: z.string().trim().min(1).max(60),
  level: z.number().int().min(0).max(100),
  flag: z.string().trim().max(8).default(""),
  flagUrl: z.string().trim().url().max(1000).nullable().default(null),
  description: z.string().trim().max(300).default(""),
});
const logoSchema = z.object({
  name: z.string().trim().min(1).max(60),
  logoUrl: z.string().trim().url().max(1000).nullable(),
  description: z.string().trim().max(300).default(""),
});
const educationSchema = z.object({
  name: z.string().trim().min(1).max(120),
  detail: z.string().trim().max(300).default(""),
  description: z.string().trim().max(300).default(""),
});

// Accept hex with optional alpha: #RGB, #RRGGBB, #RRGGBBAA
const hexColor = z
  .string()
  .trim()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "Colore non valido");

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  heroTitle: z.string().trim().min(1).max(500),
  heroIntro: z.string().trim().min(1).max(2000),
  linkedinUrl: z.string().trim().url().max(500),
  portraitUrl: z.string().trim().url().max(1000).nullable().optional(),
  featuredPaperIds: z.array(z.string().uuid()).max(3).default([]),
  aboutRole: z.string().trim().min(1).max(120),
  aboutBio: z.string().trim().min(1).max(5000),
  aboutKicker: z.string().trim().min(1).max(60),
  aboutEducationLabel: z.string().trim().min(1).max(60),
  aboutLanguagesLabel: z.string().trim().min(1).max(60),
  aboutSoftwareLabel: z.string().trim().min(1).max(60),
  aboutCertificationsLabel: z.string().trim().min(1).max(60),
  aboutPanelBg: hexColor,
  aboutPanelFg: hexColor,
  aboutLanguagesBarColor: hexColor,
  aboutLanguagesBarTrackColor: hexColor,
  aboutLogoMaxWidth: z.number().int().min(16).max(200).default(48),
  aboutPortraitPosX: z.number().int().min(0).max(100).default(50),
  aboutPortraitPosY: z.number().int().min(0).max(100).default(50),
  aboutTooltipBg: hexColor,
  aboutTooltipFg: hexColor,
  aboutTooltipBorder: hexColor,
  aboutEducation: z.array(educationSchema).max(20).default([]),
  aboutLanguages: z.array(languageSchema).max(20).default([]),
  aboutSoftware: z.array(logoSchema).max(40).default([]),
  aboutCertifications: z.array(logoSchema).max(40).default([]),
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
      about_role: data.aboutRole,
      about_bio: data.aboutBio,
      about_kicker: data.aboutKicker,
      about_education_label: data.aboutEducationLabel,
      about_languages_label: data.aboutLanguagesLabel,
      about_software_label: data.aboutSoftwareLabel,
      about_certifications_label: data.aboutCertificationsLabel,
      about_panel_bg: data.aboutPanelBg,
      about_panel_fg: data.aboutPanelFg,
      about_languages_bar_color: data.aboutLanguagesBarColor,
      about_languages_bar_track_color: data.aboutLanguagesBarTrackColor,
      about_logo_max_width: data.aboutLogoMaxWidth,
      about_portrait_pos_x: data.aboutPortraitPosX,
      about_portrait_pos_y: data.aboutPortraitPosY,
      about_tooltip_bg: data.aboutTooltipBg,
      about_tooltip_fg: data.aboutTooltipFg,
      about_tooltip_border: data.aboutTooltipBorder,
      about_education: data.aboutEducation,
      about_languages: data.aboutLanguages,
      about_software: data.aboutSoftware,
      about_certifications: data.aboutCertifications,
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

const ALLOWED_LOGO_MIME = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;
const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

const uploadLogoSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.enum(ALLOWED_LOGO_MIME),
  folder: z.enum(["software", "certifications"]),
  base64: z.string().min(1),
});

export const uploadSiteLogo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => uploadLogoSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const encoded = data.base64.includes(",")
      ? data.base64.split(",").pop()
      : data.base64;
    if (!encoded) throw new Error("Immagine non valida.");

    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const ext = MIME_EXT[data.mimeType] ?? "png";
    const safeName =
      data.fileName
        .toLowerCase()
        .replace(/\.[a-z0-9]+$/i, "")
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+|-+$/g, "") || "logo";
    const path = `${data.folder}/${Date.now()}-${safeName}.${ext}`;

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
