import { createFileRoute } from "@tanstack/react-router";
import MaxDrawdownDashboard from "@/components/MaxDrawdownDashboard";

export const Route = createFileRoute("/max-drawdown")({
  head: () => ({
    meta: [
      { title: "Massimo Drawdown Storico | Andrea Muti" },
      { name: "description", content: "Dashboard interattiva: massimo drawdown, durata e recupero per diverse asset class." },
      { property: "og:title", content: "Massimo Drawdown Storico" },
      { property: "og:description", content: "Dashboard interattiva: massimo drawdown, durata e recupero per diverse asset class." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://www.andreamuti.com/max-drawdown" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.andreamuti.com/max-drawdown" }],
  }),
  component: () => <MaxDrawdownDashboard />,
});
