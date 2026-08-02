import { createFileRoute } from "@tanstack/react-router";
import DebtServiceDashboard from "@/components/DebtServiceDashboard";

export const Route = createFileRoute("/sostenibilita-debito")({
  head: () => ({
    meta: [
      { title: "Sostenibilità del Debito (Debt Service Ratio) | Andrea Muti" },
      { name: "description", content: "Dashboard interattiva: calcola il rapporto rate/reddito, la soglia di sicurezza e l'impatto di una nuova rata." },
      { property: "og:title", content: "Sostenibilità del Debito (Debt Service Ratio)" },
      { property: "og:description", content: "Dashboard interattiva: calcola il rapporto rate/reddito, la soglia di sicurezza e l'impatto di una nuova rata." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <DebtServiceDashboard />,
});
