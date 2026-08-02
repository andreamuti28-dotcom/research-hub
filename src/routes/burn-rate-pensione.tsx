import { createFileRoute } from "@tanstack/react-router";
import RetirementBurnRateDashboard from "@/components/RetirementBurnRateDashboard";

export const Route = createFileRoute("/burn-rate-pensione")({
  head: () => ({
    meta: [
      { title: "Burn Rate e Sostenibilità in Pensione | Andrea Muti" },
      { name: "description", content: "Dashboard interattiva: tassi di prelievo, rischio di esaurimento del capitale e strategie di decumulo." },
      { property: "og:title", content: "Burn Rate e Sostenibilità in Pensione" },
      { property: "og:description", content: "Dashboard interattiva: tassi di prelievo, rischio di esaurimento del capitale e strategie di decumulo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <RetirementBurnRateDashboard />,
});
