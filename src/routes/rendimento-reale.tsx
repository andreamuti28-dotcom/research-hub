import { createFileRoute } from "@tanstack/react-router";
import RealReturnDashboard from "@/components/RealReturnDashboard";

export const Route = createFileRoute("/rendimento-reale")({
  head: () => ({
    meta: [
      { title: "Rendimento Reale e Inflazione | Andrea Muti" },
      { name: "description", content: "Dashboard interattiva: confronta capitale nominale e reale al netto dell'inflazione su orizzonti pluriennali." },
      { property: "og:title", content: "Rendimento Reale e Inflazione" },
      { property: "og:description", content: "Dashboard interattiva: confronta capitale nominale e reale al netto dell'inflazione su orizzonti pluriennali." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <RealReturnDashboard />,
});
