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
      { property: "og:url", content: "https://www.andreamuti.com/sostenibilita-debito" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.andreamuti.com/sostenibilita-debito" }],
  }),
  component: () => <DebtServiceDashboard />,
});
