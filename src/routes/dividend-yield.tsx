import { createFileRoute } from "@tanstack/react-router";
import DividendYieldDashboard from "@/components/DividendYieldDashboard";

export const Route = createFileRoute("/dividend-yield")({
  head: () => ({
    meta: [
      { title: "Dividend Yield on Cost e Crescita dei Dividendi | Andrea Muti" },
      { name: "description", content: "Dashboard interattiva: yield on cost, crescita storica dei dividendi (DGR) e proiezione del rendimento sul capitale investito." },
      { property: "og:title", content: "Dividend Yield on Cost e Crescita dei Dividendi" },
      { property: "og:description", content: "Dashboard interattiva: yield on cost, crescita storica dei dividendi (DGR) e proiezione del rendimento sul capitale investito." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <DividendYieldDashboard />,
});
