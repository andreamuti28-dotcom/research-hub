export interface Paper {
  slug: string;
  title: string;
  abstract: string;
  content: string;
  date: string; // ISO
  tags: string[];
  pdfUrl?: string;
  views?: number;
  downloads?: number;
}

export const papers: Paper[] = [
  {
    slug: "illusione-decentralizzazione-mesh",
    title: "L'illusione della decentralizzazione nelle reti Mesh",
    abstract:
      "Un'analisi critica sulle topologie di rete emergenti e la loro reale capacità di resistere al consolidamento del potere corporativo.",
    content: `Le reti mesh sono state a lungo presentate come il rimedio strutturale al consolidamento del potere nelle infrastrutture digitali. Eppure, dietro la promessa topologica, emergono dinamiche economiche e cognitive che riproducono — talvolta amplificano — le stesse asimmetrie che dovrebbero risolvere.

In questo paper analizziamo tre casi studio (Helium, NYC Mesh, Guifi.net) ed evidenziamo come la decentralizzazione tecnica non implichi automaticamente decentralizzazione del potere. La governance, il capitale paziente e le economie di scala determinano l'esito politico più della topologia stessa.

La tesi: serve un vocabolario nuovo che distingua tra decentralizzazione architetturale, logica e politica. Senza questa distinzione, continueremo a costruire infrastrutture che si presentano come orizzontali ma operano come gerarchie.`,
    date: "2024-03-12",
    tags: ["Infrastrutture", "Etica"],
    views: 4820,
    downloads: 612,
  },
  {
    slug: "ontologia-modelli-linguistici",
    title: "Ontologia dei modelli linguistici",
    abstract:
      "Verso una nuova definizione di intelligenza: come la statistica predittiva sta ridefinendo il concetto di comprensione umana.",
    content: `Cosa significa "capire" per un modello che non ha corpo, intenzione né tempo? Questo saggio propone una ontologia operativa dei LLM che eviti tanto l'antropomorfismo ingenuo quanto il riduzionismo sprezzante.

Argomento che la comprensione, nei sistemi predittivi, è una proprietà emergente del contesto, non una capacità interna del modello. Da questo segue una serie di implicazioni per la valutazione, la responsabilità giuridica e la pedagogia.`,
    date: "2024-01-22",
    tags: ["AI", "Cognizione"],
    views: 7140,
    downloads: 1283,
  },
  {
    slug: "ux-post-ai",
    title: "Nuovi paradigmi di UX nell'era post-AI",
    abstract:
      "L'interfaccia smette di essere un oggetto e diventa una conversazione. Cosa cambia per chi progetta esperienze digitali?",
    content: `Per trent'anni la disciplina UX si è costruita attorno alla manipolazione diretta. L'avvento di interfacce conversazionali generative non sostituisce questo paradigma — lo affianca, creando un'ecologia ibrida che richiede nuovi strumenti concettuali.

Esaminiamo cinque pattern emergenti: ambient intent, soft commitment, latency choreography, model-as-material, e generative defaults. Per ciascuno proponiamo euristiche operative.`,
    date: "2023-11-08",
    tags: ["UX", "AI"],
    views: 3210,
    downloads: 408,
  },
  {
    slug: "fenomenologia-consenso",
    title: "La fenomenologia del consenso nell'era della sorveglianza algoritmica",
    abstract:
      "I sistemi di raccomandazione non influenzano solo i consumi: ridisegnano la struttura stessa della volizione.",
    content: `Il consenso, nel diritto liberale classico, presuppone un soggetto informato e libero. Ma cosa accade quando l'ambiente informativo è esso stesso modellato per massimizzare metriche di engagement?

Questo paper propone una rilettura fenomenologica del consenso digitale, mutuando categorie da Husserl e Merleau-Ponty, per evidenziare come la sorveglianza algoritmica eroda non solo la privacy ma la struttura della volontà.`,
    date: "2023-09-14",
    tags: ["Etica", "Sociology"],
    views: 5670,
    downloads: 901,
  },
];

export const allTags = Array.from(
  new Set(papers.flatMap((p) => p.tags)),
).sort();

export function getPaper(slug: string): Paper | undefined {
  return papers.find((p) => p.slug === slug);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    month: "long",
    year: "numeric",
  });
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
