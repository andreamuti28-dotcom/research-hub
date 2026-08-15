import { createFileRoute } from "@tanstack/react-router";
import TaxEfficiencyDashboard from "@/components/TaxEfficiencyDashboard";

export const Route = createFileRoute("/efficienza-fiscale")({
  head: () => ({
    meta: [
      { title: "Efficienza Fiscale dei Capitali | Andrea Muti" },
      {
        name: "description",
        content:
          "Dashboard interattiva: confronta ETF ad accumulazione e distribuzione, drag fiscale e imposta di bollo su orizzonti pluriennali.",
      },
      { property: "og:title", content: "Efficienza Fiscale dei Capitali" },
      {
        property: "og:description",
        content:
          "Simulatore interattivo: accumulazione vs distribuzione, tassazione e bollo.",
      },
      { property: "og:url", content: "https://www.andreamuti.com/efficienza-fiscale" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.andreamuti.com/efficienza-fiscale" }],
  }),
  component: () => <TaxEfficiencyDashboard />,
});
