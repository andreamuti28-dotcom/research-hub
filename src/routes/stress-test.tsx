import { createFileRoute } from "@tanstack/react-router";
import StressTestDashboard from "@/components/StressTestDashboard";

export const Route = createFileRoute("/stress-test")({
  head: () => ({
    meta: [
      { title: "Stress Test di Portafoglio | Andrea Muti" },
      {
        name: "description",
        content:
          "Dashboard interattiva: applica shock di mercato a un portafoglio multi-asset e osserva l'impatto sul patrimonio netto.",
      },
      { property: "og:title", content: "Stress Test di Portafoglio" },
      {
        property: "og:description",
        content:
          "Simulatore interattivo di scenari di stress su portafogli multi-asset.",
      },
    ],
  }),
  component: () => <StressTestDashboard />,
});
