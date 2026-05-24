import { useQuery } from "@tanstack/react-query";
import { getSiteSettings, type SiteSettings } from "@/lib/site-settings.functions";

export const siteSettingsQuery = {
  queryKey: ["site-settings"] as const,
  queryFn: () => getSiteSettings(),
  staleTime: 60_000,
};

const DEFAULTS: SiteSettings = {
  name: "Andrea Muti",
  heroTitle: "Esplorando l'intersezione tra Etica Digitale e Infrastrutture.",
  heroIntro:
    "Sono un ricercatore indipendente basato a Milano. Mi occupo di come le architetture software influenzano il comportamento sociale. Questo spazio è il mio archivio di paper, saggi e riflessioni tecniche.",
  linkedinUrl: "https://www.linkedin.com",
  contactEmail: "",
  portraitUrl: null,
  featuredPaperIds: [],
  homeFeaturedLabel: "Paper in Evidenza",
  homeMarketLabel: "Analisi Mercati Finanziari",
  homeMarketEnabled: true,
  homeMarketDisclaimer: "Intelligenza Artificiale integrata",
  archiveDisclaimer: "Intelligenza Artificiale integrata",
  headerBg: "",
  aboutRole: "Ricercatore indipendente",

  aboutBio: "",
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

export function useSiteSettings(): SiteSettings {
  const { data } = useQuery(siteSettingsQuery);
  return data ?? DEFAULTS;
}
