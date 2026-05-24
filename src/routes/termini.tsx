import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/termini")({
  head: () => ({
    meta: [
      { title: "Termini e Condizioni — Andrea Muti" },
      {
        name: "description",
        content:
          "Termini e condizioni di utilizzo del sito di Andrea Muti: proprietà intellettuale, limitazioni di responsabilità e legge applicabile.",
      },
      { property: "og:title", content: "Termini e Condizioni — Andrea Muti" },
      { property: "og:description", content: "Termini di utilizzo del sito." },
      { property: "og:url", content: "/termini" },
    ],
    links: [{ rel: "canonical", href: "/termini" }],
  }),
  component: TerminiPage,
});

function TerminiPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 md:py-24 w-full">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          Informativa
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tighter italic mb-8">
          Termini e Condizioni
        </h1>

        <div className="space-y-8 leading-relaxed text-foreground">
          <section>
            <h2 className="font-display text-xl font-bold mb-2">1. Oggetto</h2>
            <p>
              Il presente sito è uno spazio editoriale personale di Andrea Muti dedicato
              alla pubblicazione di paper, saggi e analisi indipendenti. L'accesso e la
              consultazione sono gratuiti.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">
              2. Proprietà intellettuale
            </h2>
            <p>
              Tutti i contenuti (testi, immagini, grafici, codice) sono di proprietà di
              Andrea Muti o dei rispettivi autori e sono protetti dalle leggi vigenti sul
              diritto d'autore. È consentita la citazione con indicazione della fonte e
              link alla pagina originale. La riproduzione integrale o sostanziale,
              anche per fini commerciali, richiede autorizzazione scritta.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">
              3. Natura dei contenuti
            </h2>
            <p>
              I contenuti pubblicati hanno scopo informativo e di ricerca. Le analisi sui
              mercati finanziari non costituiscono consulenza finanziaria, raccomandazione
              di investimento o sollecitazione al pubblico risparmio ai sensi del TUF
              (D.lgs. 58/1998). Ogni decisione di investimento è di esclusiva
              responsabilità dell'utente.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">
              4. Limitazione di responsabilità
            </h2>
            <p>
              I contenuti sono forniti "così come sono", senza garanzie esplicite o
              implicite di completezza, accuratezza o aggiornamento. Nei limiti di legge,
              il titolare non risponde di danni diretti o indiretti derivanti dall'uso o
              dall'impossibilità di uso del sito o dei suoi contenuti.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">5. Link esterni</h2>
            <p>
              Il sito può contenere link a risorse di terzi. Il titolare non controlla né
              risponde dei contenuti, delle policy o delle pratiche di tali siti.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">6. Dati personali</h2>
            <p>
              Il trattamento dei dati personali è disciplinato dalla{" "}
              <Link to="/privacy" className="underline hover:text-primary">
                Privacy Policy
              </Link>{" "}
              e dalla{" "}
              <Link to="/cookie-policy" className="underline hover:text-primary">
                Cookie Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">7. Modifiche</h2>
            <p>
              Il titolare si riserva il diritto di modificare in qualsiasi momento i
              presenti termini. Le modifiche entrano in vigore dalla data di
              pubblicazione su questa pagina.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">
              8. Legge applicabile e foro
            </h2>
            <p>
              I presenti termini sono regolati dalla legge italiana. Per ogni
              controversia è competente in via esclusiva il foro di residenza del
              titolare, fatte salve le tutele inderogabili previste per i consumatori.
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
