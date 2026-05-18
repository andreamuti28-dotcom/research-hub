import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Area Riservata — Studio / Marco Rossi" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPlaceholder,
});

function AdminPlaceholder() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 max-w-2xl mx-auto px-6 py-24 md:py-32 w-full text-center">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          /admin
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tighter italic mb-6">
          Area Riservata
        </h1>
        <p className="text-muted-foreground leading-relaxed mb-8 max-w-[50ch] mx-auto">
          Il pannello di gestione (login, CMS, analytics) sarà costruito nel
          prossimo passo. Per ora, esplora la vista pubblica.
        </p>
        <Link
          to="/"
          className="inline-block px-4 py-2 bg-foreground text-background font-display text-[11px] font-bold uppercase tracking-wider hover:bg-primary transition-colors"
        >
          Torna alla homepage
        </Link>
      </div>
      <SiteFooter />
    </div>
  );
}
