import { createFileRoute } from "@tanstack/react-router";
import InterestDashboard from "@/components/InterestDashboard";

export const Route = createFileRoute("/interesse-composto")({
  head: () => ({
    meta: [
      { title: "Interesse Semplice vs Composto | Andrea Muti" },
      {
        name: "description",
        content:
          "Dashboard interattiva: confronta la crescita del capitale con interesse semplice e composto, versamenti periodici e diverse frequenze di capitalizzazione.",
      },
      { property: "og:title", content: "Interesse Semplice vs Composto" },
      {
        property: "og:description",
        content:
          "Simulatore interattivo di interesse semplice e composto con versamenti periodici.",
      },
    ],
  }),
  component: () => <InterestDashboard />,
});
