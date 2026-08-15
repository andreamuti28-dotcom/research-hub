import { createFileRoute } from "@tanstack/react-router";
import TwrMwrDashboard from "@/components/TwrMwrDashboard";

export const Route = createFileRoute("/twr-mwr")({
  head: () => ({
    meta: [
      { title: "TWR vs MWR — Come misurare il rendimento | Andrea Muti" },
      { name: "description", content: "Dashboard interattiva: differenza tra rendimento time-weighted e money-weighted (IRR) con flussi di cassa reali." },
      { property: "og:title", content: "TWR vs MWR — Come misurare il rendimento" },
      { property: "og:description", content: "Dashboard interattiva: differenza tra rendimento time-weighted e money-weighted (IRR) con flussi di cassa reali." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:url", content: "https://www.andreamuti.com/twr-mwr" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://www.andreamuti.com/twr-mwr" }],
  }),
  component: () => <TwrMwrDashboard />,
});
