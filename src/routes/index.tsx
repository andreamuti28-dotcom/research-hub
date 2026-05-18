import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import portrait from "@/assets/portrait.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PaperRow } from "@/components/PaperRow";
import { listPublishedPapers } from "@/lib/papers.functions";

const papersQuery = {
  queryKey: ["papers", "published"] as const,
  queryFn: () => listPublishedPapers(),
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Studio / Marco Rossi — Ricerca autonoma" },
      {
        name: "description",
        content:
          "Archivio di paper e saggi di ricerca indipendente sull'intersezione tra etica digitale, infrastrutture e cognizione.",
      },
      { property: "og:title", content: "Studio / Marco Rossi — Ricerca autonoma" },
      {
        property: "og:description",
        content:
          "Paper di ricerca autonoma su etica digitale, infrastrutture e modelli linguistici.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(papersQuery),
  component: Index,
});

function Index() {
  const { data: papers } = useSuspenseQuery(papersQuery);
  const latest = papers.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />

      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-[1fr_400px] gap-16 items-start w-full">
        <div className="animate-fade-up">
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tighter leading-[0.95] text-balance mb-8 italic">
            Esplorando l'intersezione tra{" "}
            <span className="text-primary">Etica Digitale</span> e
            Infrastrutture.
          </h1>
          <div className="max-w-[55ch] text-lg md:text-xl leading-relaxed text-pretty space-y-6">
            <p>
              Sono un ricercatore indipendente basato a Milano. Mi occupo di
              come le architetture software influenzano il comportamento
              sociale. Questo spazio è il mio archivio di paper, saggi e
              riflessioni tecniche.
            </p>
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 font-display text-sm font-bold uppercase tracking-widest border-b-2 border-foreground pb-1 hover:text-primary hover:border-primary transition-all"
            >
              LinkedIn Profile
            </a>
          </div>
        </div>
        <div className="animate-fade-up [animation-delay:200ms]">
          <img
            src={portrait}
            alt="Ritratto editoriale in bianco e nero di Marco Rossi"
            width={800}
            height={1000}
            className="w-full aspect-[4/5] object-cover bg-surface outline-1 -outline-offset-1 outline-black/5 rounded-xs"
          />
        </div>
      </section>

      <section className="border-t border-border bg-surface py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                Pubblicazioni recenti
              </div>
              <h2 className="text-3xl font-display font-bold tracking-tighter">
                Ultimi Paper
              </h2>
            </div>
            <Link
              to="/archivio"
              className="inline-flex items-center gap-2 font-display text-xs font-bold uppercase tracking-widest border-b-2 border-foreground pb-1 hover:text-primary hover:border-primary transition-all self-start md:self-auto"
            >
              Vedi tutto l'archivio →
            </Link>
          </div>

          {latest.length === 0 ? (
            <div className="border border-border p-12 text-center font-mono text-xs uppercase tracking-widest text-muted-foreground bg-background">
              Nessun paper pubblicato. Accedi all'area riservata per iniziare.
            </div>
          ) : (
            <div className="space-y-px bg-border border border-border">
              {latest.map((p) => (
                <PaperRow key={p.id} paper={p} />
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="flex-1" />
      <SiteFooter />
    </div>
  );
}
