import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useConsent } from "@/hooks/use-consent";

export const Route = createFileRoute("/cookie-policy")({
  head: () => ({
    meta: [
      { title: "Cookie Policy — Andrea Muti" },
      {
        name: "description",
        content:
          "Elenco dei cookie e degli identificatori usati da questo sito, finalità, durata e modalità di revoca del consenso.",
      },
      { property: "og:title", content: "Cookie Policy — Andrea Muti" },
      { property: "og:description", content: "Cookie usati dal sito e gestione del consenso." },
      { property: "og:url", content: "/cookie-policy" },
    ],
    links: [{ rel: "canonical", href: "/cookie-policy" }],
  }),
  component: CookiePolicyPage,
});

function CookiePolicyPage() {
  const { reopen } = useConsent();
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 md:py-24 w-full">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          Informativa
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tighter italic mb-8">
          Cookie Policy
        </h1>

        <div className="space-y-8 leading-relaxed text-foreground">
          <section>
            <h2 className="font-display text-xl font-bold mb-2">Cosa sono i cookie</h2>
            <p>
              I cookie sono piccoli file di testo memorizzati dal browser durante la
              navigazione. Funzioni simili (es. <em>localStorage</em>) sono trattate qui
              allo stesso modo dei cookie.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">Cookie utilizzati</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3 font-display">Nome</th>
                    <th className="text-left p-3 font-display">Categoria</th>
                    <th className="text-left p-3 font-display">Finalità</th>
                    <th className="text-left p-3 font-display">Durata</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="p-3 font-mono text-xs">theme</td>
                    <td className="p-3">Tecnico</td>
                    <td className="p-3">Memorizza tema chiaro/scuro.</td>
                    <td className="p-3">Persistente</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-3 font-mono text-xs">lang</td>
                    <td className="p-3">Tecnico</td>
                    <td className="p-3">Memorizza lingua (IT/EN).</td>
                    <td className="p-3">Persistente</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-3 font-mono text-xs">cookie_consent_v2</td>
                    <td className="p-3">Tecnico</td>
                    <td className="p-3">Memorizza la scelta sui cookie.</td>
                    <td className="p-3">12 mesi</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td className="p-3 font-mono text-xs">visitor_token</td>
                    <td className="p-3">Statistico (con consenso)</td>
                    <td className="p-3">Identificatore casuale anonimo per il conteggio aggregato delle visite.</td>
                    <td className="p-3">Persistente</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">Cookie di terze parti</h2>
            <p>
              Il sito utilizza Google Fonts per caricare i font tipografici. Google può
              registrare l'indirizzo IP della richiesta. Non vengono impostati cookie di
              profilazione né di marketing di terze parti (es. Google Analytics, Meta
              Pixel, ad network).
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">Gestione del consenso</h2>
            <p>
              Puoi modificare o revocare in qualsiasi momento la tua scelta usando il
              pulsante qui sotto. Al successivo caricamento il banner ti chiederà di
              nuovo le preferenze.
            </p>
            <button
              type="button"
              onClick={reopen}
              className="mt-4 px-4 py-2 text-xs font-display font-bold uppercase tracking-widest border-2 border-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              Modifica preferenze cookie
            </button>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">Riferimenti</h2>
            <p>
              Per il dettaglio sui dati personali, finalità e diritti dell'interessato
              consulta la{" "}
              <Link to="/privacy" className="underline hover:text-primary">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <p className="text-xs text-muted-foreground mt-12">
            Ultimo aggiornamento:{" "}
            {new Date().toLocaleDateString("it-IT", { month: "long", year: "numeric" })}.
          </p>
        </div>

        <div className="mt-12">
          <Link
            to="/"
            className="font-display text-xs font-bold uppercase tracking-widest border-b-2 border-foreground pb-0.5 hover:text-primary hover:border-primary transition-all"
          >
            ← Torna alla home
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
