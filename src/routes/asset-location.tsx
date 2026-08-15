import { createFileRoute } from "@tanstack/react-router";
import AssetLocationDashboard from "@/components/AssetLocationDashboard";

export const Route = createFileRoute("/asset-location")({
  head: () => ({
    meta: [
      { title: "Asset Location e Efficienza Fiscale | Andrea Muti" },
      { name: "description", content: "Dashboard interattiva: come distribuire gli asset tra contenitori fiscali per ridurre il prelievo fiscale." },
      { property: "og:title", content: "Asset Location e Efficienza Fiscale" },
      { property: "og:description", content: "Dashboard interattiva: come distribuire gli asset tra contenitori fiscali per ridurre il prelievo fiscale." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://www.andreamuti.com/asset-location" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.andreamuti.com/asset-location" }],
  }),
  component: () => <AssetLocationDashboard />,
});
