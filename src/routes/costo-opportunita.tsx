import { createFileRoute } from "@tanstack/react-router";
import OpportunityCostDashboard from "@/components/OpportunityCostDashboard";

export const Route = createFileRoute("/costo-opportunita")({
  head: () => ({
    meta: [
      { title: "Costo Opportunità degli Investimenti | Andrea Muti" },
      { name: "description", content: "Dashboard interattiva: confronta strategie alternative e la liquidità ferma per quantificare il costo opportunità." },
      { property: "og:title", content: "Costo Opportunità degli Investimenti" },
      { property: "og:description", content: "Dashboard interattiva: confronta strategie alternative e la liquidità ferma per quantificare il costo opportunità." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://www.andreamuti.com/costo-opportunita" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.andreamuti.com/costo-opportunita" }],
  }),
  component: () => <OpportunityCostDashboard />,
});
