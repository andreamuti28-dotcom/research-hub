# Rifiniture: home, SEO e area admin

Interventi piccoli e mirati, nessun cambio strutturale. Ho verificato ogni punto sul codice e sulla home renderizzata (mobile 390px e desktop 1280px).

## 1. Home — UX e design

**Hero senza video**
Oggi, se il video non è impostato o non parte, resta un grande rettangolo grigio vuoto (visibile sia su mobile sia su desktop). Aggiungo un fallback: se manca il video, l'area mostra il logo hero (giorno/notte) al posto del box vuoto, e il video riceve un poster in modo che non ci sia mai un vuoto durante il caricamento.

**Abstract troppo lunghi**
Nelle card dei paper l'abstract viene mostrato per intero: una singola card può occupare più di uno schermo. Lo limito a 3 righe con troncamento elegante; il testo completo resta nella pagina del paper.

**Chiarezza della categoria attiva**
Le sottosezioni della categoria non selezionata restano visibili e cliccabili sulla stessa riga, quindi non è immediato capire cosa è attivo. Rendo la coppia inattiva chiaramente secondaria (opacità e peso ridotti) mantenendo il click, e marco la sottosezione attiva con la sola sottolineatura piena. Nessun cambio di struttura o di transizione.

**Ritmo verticale mobile**
Su mobile gli spazi tra hero, logo Forbes e pulsanti sono disomogenei. Uniformo la spaziatura e allineo i tre pulsanti alla stessa altezza.

**Barra cookie**
Su mobile il banner copre gran parte del primo paper. Lo rendo più compatto (testo ridotto, pulsanti su una riga) mantenendo lo stesso contenuto legale.

## 2. SEO e condivisione

**Immagine social mancante**
Nessuna pagina espone `og:image` / `twitter:image`: le condivisioni su LinkedIn, WhatsApp e X mostrano un riquadro senza immagine. Aggiungo un'immagine di anteprima 1200x630 come asset pubblico del progetto e la collego a home, archivio, about e pagine paper.

**Sitemap incompleta**
La sitemap elenca solo 6 pagine statiche più i paper: tutte le ~17 dashboard interattive (mutuo, interesse composto, stress test, ecc.) sono assenti e quindi difficilmente indicizzabili. Le aggiungo con priorità e frequenza coerenti.

**Metadati delle dashboard**
Le pagine dashboard hanno titolo e descrizione ma non hanno `canonical`, `og:url` né `og:type`/`twitter:card` propri. Li completo su tutte.

**Attributo lingua**
`<html lang="en">` è fisso mentre i contenuti di default sono in italiano: incoerenza per Google e per gli screen reader. Lo allineo alla lingua attiva dell'interfaccia.

## 3. Area admin e affidabilità

**Navigazione**
Nove voci in una riga scorrevole su mobile: le voci a destra restano nascoste. Le raggruppo visivamente (Contenuti / Dati / Impostazioni) mantenendo tutte le destinazioni attuali.

**Feedback delle azioni**
Le operazioni di salvataggio non sempre danno un riscontro visibile. Uniformo con notifiche di successo/errore e stato "in corso" sui pulsanti nelle schermate di modifica.

## Dettagli tecnici

- `src/routes/index.tsx`: fallback hero, clamp abstract, gerarchia tab, spaziature.
- `src/components/CookieConsent.tsx`: layout compatto su mobile.
- Nuovo asset `src/assets/og-cover.jpg` (1200x630) + tag `og:image`/`twitter:image` in `index.tsx`, `archivio.tsx`, `about.tsx`, `paper.$slug.tsx`.
- `src/routes/sitemap[.]xml.ts`: aggiunta delle rotte dashboard; nessun `lastmod` inventato.
- `head()` delle rotte dashboard: `canonical`, `og:url`, `og:type`, `twitter:card`.
- `src/routes/__root.tsx`: `lang` derivato dalla lingua attiva.
- `src/components/AdminShell.tsx`: raggruppamento voci; toast via `sonner` nelle schermate admin.

Nessuna modifica a database, logica di business o sincronizzazione mercati.
