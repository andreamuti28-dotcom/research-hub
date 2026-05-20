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
  portraitUrl: null,
  featuredPaperIds: [],
};

export function useSiteSettings(): SiteSettings {
  const { data } = useQuery(siteSettingsQuery);
  return data ?? DEFAULTS;
}
