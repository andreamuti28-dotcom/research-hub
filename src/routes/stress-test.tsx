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
      { property: "og:url", content: "https://www.andreamuti.com/stress-test" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.andreamuti.com/stress-test" }],
  }),
  component: () => <StressTestDashboard />,
});
