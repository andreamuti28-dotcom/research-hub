import { createFileRoute } from "@tanstack/react-router";
import MortgageDashboard from "@/components/MortgageDashboard";

export const Route = createFileRoute("/mutuo")({
  head: () => ({
    meta: [
      { title: "Simulazione Mutuo — Fisso vs Variabile | Andrea Muti" },
      {
        name: "description",
        content:
          "Dashboard interattiva per confrontare mutuo a tasso fisso e variabile: rata, break-even, scenari BCE e piano di ammortamento.",
      },
      { property: "og:title", content: "Simulazione Mutuo — Fisso vs Variabile" },
      {
        property: "og:description",
        content:
          "Simulatore interattivo mutuo: fisso vs variabile, scenari BCE, break-even e ammortamento.",
      },
    ],
  }),
  component: MutuoPage,
});

function MutuoPage() {
  return <MortgageDashboard />;
}
