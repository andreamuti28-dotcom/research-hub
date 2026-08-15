import { createFileRoute } from "@tanstack/react-router";
import TrackingErrorDashboard from "@/components/TrackingErrorDashboard";

export const Route = createFileRoute("/tracking-error")({
  head: () => ({
    meta: [
      { title: "Tracking Error e Information Ratio | Andrea Muti" },
      { name: "description", content: "Dashboard interattiva: scostamento di un fondo dal benchmark, tracking error annualizzato e information ratio." },
      { property: "og:title", content: "Tracking Error e Information Ratio" },
      { property: "og:description", content: "Dashboard interattiva: scostamento di un fondo dal benchmark, tracking error annualizzato e information ratio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://www.andreamuti.com/tracking-error" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.andreamuti.com/tracking-error" }],
  }),
  component: () => <TrackingErrorDashboard />,
});
