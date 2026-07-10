import { createFileRoute } from "@tanstack/react-router";
import RebalancingDashboard from "@/components/RebalancingDashboard";

export const Route = createFileRoute("/ribilanciamento")({
  head: () => ({
    meta: [
      { title: "Ribilanciamento e Drift di Portafoglio | Andrea Muti" },
      {
        name: "description",
        content:
          "Dashboard interattiva: analizza il drift delle asset class e simula un piano di ribilanciamento al target.",
      },
      { property: "og:title", content: "Ribilanciamento e Drift di Portafoglio" },
      {
        property: "og:description",
        content:
          "Simulatore interattivo di drift e ribilanciamento multi-asset.",
      },
    ],
  }),
  component: () => <RebalancingDashboard />,
});
