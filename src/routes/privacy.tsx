import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy & Cookie — Andrea Muti" },
      {
        name: "description",
        content:
          "Informativa privacy e cookie del sito di Andrea Muti, ricercatore indipendente.",
      },
      { property: "og:title", content: "Privacy & Cookie — Andrea Muti" },
      { property: "og:description", content: "Informativa privacy e cookie del sito." },
      { property: "og:url", content: "https://www.andreamuti.com/privacy" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Privacy & Cookie — Andrea Muti" },
      { name: "twitter:description", content: "Informativa privacy e cookie del sito." },
    ],
    links: [{ rel: "canonical", href: "https://www.andreamuti.com/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 md:py-24 w-full">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-4">
          Informativa
        </div>
        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tighter italic mb-8">
          Privacy & Cookie
        </h1>

        <div className="space-y-8 text-pretty text-justify leading-relaxed text-foreground">
          <section>
            <h2 className="font-display text-xl font-bold mb-2">Titolare del trattamento</h2>
            <p>
              Andrea Muti, ricercatore indipendente. Per qualsiasi richiesta relativa ai
              tuoi dati puoi contattarmi tramite{" "}
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noreferrer noopener"
                className="underline hover:text-primary"
              >
                LinkedIn
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">Dati raccolti</h2>
            <p>
              Questo sito non richiede registrazione né raccoglie dati personali
              identificativi. Se accetti l'informativa cookie, viene memorizzato
              localmente nel tuo browser un identificatore anonimo (token casuale) usato
              esclusivamente per contare in modo aggregato il numero di visite. Non
              vengono raccolti indirizzo IP completo, dati di navigazione cross-site,
              dati di profilazione o dati pubblicitari.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">Cookie e storage</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Tecnici</strong> (sempre attivi): preferenza tema (chiaro/scuro)
                e lingua (IT/EN), conservate nel <em>localStorage</em>.
              </li>
              <li>
                <strong>Statistici anonimi</strong> (solo con il tuo consenso): un token
                anonimo nel <em>localStorage</em> e un marcatore di sessione, usati per
                il conteggio delle visite aggregate.
              </li>
            </ul>
            <p className="mt-3">
              Non sono presenti cookie di profilazione, di terze parti pubblicitarie o di
              social tracking.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">Base giuridica</h2>
            <p>
              Cookie tecnici: legittimo interesse al funzionamento del sito (art. 6.1.f
              GDPR). Statistiche anonime: consenso dell'utente (art. 6.1.a GDPR), che
              puoi negare o ritirare in qualsiasi momento.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">Revoca del consenso</h2>
            <p>
              Per revocare il consenso, cancella i dati del sito dal tuo browser
              (Impostazioni → Privacy → Dati dei siti) oppure apri questa pagina in
              modalità privata. Al prossimo accesso ti verrà nuovamente richiesta la
              scelta.
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold mb-2">Diritti dell'utente</h2>
            <p>
              In base al GDPR hai diritto di accesso, rettifica, cancellazione,
              limitazione, opposizione e portabilità rispetto ai tuoi dati. Per
              esercitarli scrivi tramite{" "}
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noreferrer noopener"
                className="underline hover:text-primary"
              >
                LinkedIn
              </a>
              . Hai inoltre diritto di reclamo all'Autorità Garante per la protezione
              dei dati personali ({" "}
              <a
                href="https://www.garanteprivacy.it"
                target="_blank"
                rel="noreferrer noopener"
                className="underline hover:text-primary"
              >
                garanteprivacy.it
              </a>
              ).
            </p>
          </section>

          <p className="text-xs text-muted-foreground mt-12">
            Ultimo aggiornamento: {new Date().toLocaleDateString("it-IT", { month: "long", year: "numeric" })}.
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
