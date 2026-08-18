# Piano: aggiungere 5 nuove lingue al sito

## Obiettivo
Espandere il sito da italiano + inglese a **6 lingue totali**: IT, EN, ES (spagnolo), DE (tedesco), ZH (cinese semplificato), RU (russo), AR (arabo). La lingua di default rimane **italiano**. I paper vengono tradotti automaticamente nella lingua UI tramite il sistema di traduzione esistente.

## Cosa cambia tecnicamente

### 1. Tipi e stato lingua
- Estendere il tipo `Lang` in `src/hooks/use-language.ts` da `"it" | "en"` a `"it" | "en" | "es" | "de" | "zh" | "ru" | "ar"`.
- Mantenere il default su `"it"` e nessuna persistenza in localStorage (come da regola di memoria).
- Aggiornare lo script di bootstrap per impostare `document.documentElement.lang` correttamente anche per arabo (`dir="rtl"`).

### 2. Dizionari i18n
- Aggiungere in `src/lib/i18n.ts` i dizionari `es`, `de`, `zh`, `ru`, `ar` con le stesse chiavi di `en`/`it`.
- Le traduzioni verranno generate partendo dal dizionario italiano/inglese esistente e completate con AI Gateway in batch, poi verificate a campione.

### 3. Traduzione automatica contenuti
- Estendere lo schema `target` in `src/lib/translate.functions.ts` da `["it", "en"]` a tutte e 6 le lingue.
- Verificare che `useTranslated` e `useTranslatedAlways` funzionino con le nuove lingue senza modifiche strutturali (usano già la lingua corrente come target).
- Aggiungere fallback locale per date e numeri nelle nuove lingue.

### 4. Selettore lingua UI
- Sostituire il toggle IT/EN in `src/components/LanguageToggle.tsx` con un menu a discesa (dropdown) che mostri tutte le lingue disponibili.
- Aggiornare `src/components/Flag.tsx` per supportare le bandiere delle nuove nazioni (ES, DE, CN, RU, SA/AR).

### 5. RTL (arabo)
- Aggiungere gestione direzionale per `ar`: impostare `dir="rtl"` su `<html>` quando la lingua è arabo.
- Verificare che Tailwind/CSS gestiscano correttamente margini/padding simmetrici; dove necessario usare utility RTL-safe (`ms-*`, `me-*`, `ps-*`, `pe-*`).

### 6. SEO e metadati
- Aggiornare `src/routes/__root.tsx` per generare tag `hreflang` per tutte le lingue.
- Aggiornare `og:locale` e `twitter` metadata nelle pagine principali in base alla lingua attiva.
- Aggiungere `x-default` hreflang verso la versione italiana.

### 7. Date, numeri e locale
- Estendere `formatDate`/`formatDateShort` in `src/data/papers.ts` con le locale corrette:
  - ES: `es-ES`
  - DE: `de-DE`
  - ZH: `zh-CN`
  - RU: `ru-RU`
  - AR: `ar-SA`

### 8. Test e verifica
- Verificare che ogni lingua carichi correttamente senza errori SSR.
- Testare la traduzione automatica di un paper in ciascuna lingua.
- Verificare il layout RTL per l'arabo.
- Controllare che il selettore lingua funzioni su mobile.

## Non incluso in questo piano
- Traduzione dei paper in lingua "originale" separata (i paper restano in it/en/both e vengono tradotti automaticamente).
- Persistenza della lingua scelta (mantiene la regola di memoria: nessuna persistenza, reset a italiano).
- Modifiche al CMS admin oltre all'eventuale aggiunta di un'opzione di default lingua (se necessaria).

## Stima
Implementazione media: tipi, selettore, RTL, SEO e traduzione dizionari sono il grosso del lavoro. I dizionari (~180 chiavi × 5 lingue) richiedono la maggior parte del tempo.