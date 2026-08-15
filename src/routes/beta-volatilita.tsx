import { createFileRoute } from "@tanstack/react-router";
import BetaVolatilityDashboard from "@/components/BetaVolatilityDashboard";

export const Route = createFileRoute("/beta-volatilita")({
  head: () => ({
    meta: [
      { title: "Beta e Volatilità del Portafoglio | Andrea Muti" },
      { name: "description", content: "Dashboard interattiva: beta, alpha, correlazione e volatilità del portafoglio rispetto al benchmark." },
      { property: "og:title", content: "Beta e Volatilità del Portafoglio" },
      { property: "og:description", content: "Dashboard interattiva: beta, alpha, correlazione e volatilità del portafoglio rispetto al benchmark." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://www.andreamuti.com/beta-volatilita" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.andreamuti.com/beta-volatilita" }],
  }),
  component: () => <BetaVolatilityDashboard />,
});
