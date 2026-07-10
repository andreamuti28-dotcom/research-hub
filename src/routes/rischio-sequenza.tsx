import { createFileRoute } from "@tanstack/react-router";
import SequenceRiskDashboard from "@/components/SequenceRiskDashboard";

export const Route = createFileRoute("/rischio-sequenza")({
  head: () => ({
    meta: [
      { title: "Rischio di Sequenza dei Rendimenti | Andrea Muti" },
      {
        name: "description",
        content:
          "Dashboard interattiva: come l'ordine dei rendimenti influenza il capitale finale con versamenti periodici (PAC).",
      },
      { property: "og:title", content: "Rischio di Sequenza dei Rendimenti" },
      {
        property: "og:description",
        content:
          "Simulatore interattivo del sequence-of-returns risk con PAC.",
      },
    ],
  }),
  component: () => <SequenceRiskDashboard />,
});
