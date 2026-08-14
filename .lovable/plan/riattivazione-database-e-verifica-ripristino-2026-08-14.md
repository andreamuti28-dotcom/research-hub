# Riattivazione database e verifica ripristino

## Problema
Il backend del sito (Lovable Cloud) è in stato `INACTIVE` / pausa. Per questo ogni server function (report mercati, paper, dashboard, impostazioni sito) fallisce con `fetch failed` e la preview restituisce errore 500.

## Step per riattivare il database

1. Apri il pannello **Backend** del progetto (usa il pulsante "View Backend" in alto).
2. Cerca lo stato dell’istanza database: dovrebbe essere indicato come **Paused** / **In pausa**.
3. Clicca il pulsante di **ripristino/resume** (di solito etichettato "Resume project", "Ripristina" o un’icona play).
4. Conferma l’eventuale dialogo. La riattivazione può richiedere da pochi secondi a un paio di minuti.

## Verifica post-riattivazione

Una volta che confermi di aver riattivato, io controllerò:

1. **Stato backend**: chiamo `supabase--cloud_status` e attendo che torni `ACTIVE_HEALTHY`.
2. **Homepage**: verifico che `/` carichi senza errori 500.
3. **Report mercati**: verifico che la sezione "Report Analisi Mercati Finanziari" mostri l’ultimo report.
4. **Pubblicazioni e dashboard**: verifico che le liste di paper e dashboard interattive si carichino.
5. **Admin**: verifico che la sezione admin possa leggere `site_settings` e le altre tabelle.

## Note
- Non serve toccare codice: l’errore è solo conseguenza del database spento.
- Se il pulsante di ripristino non fosse disponibile o la riattivazione fallisse, segnalamelo così posso aprire una richiesta di supporto infrastruttura.
