# Il sito non carica: database in pausa

## Cosa sta succedendo

La homepage restituisce un errore server ("fetch failed") perché il database del sito (Lovable Cloud) è attualmente **in pausa**. Tutte le chiamate a dati e autenticazione falliscono, quindi le sezioni Pubblicazioni, Report mercati, Dashboard e News non riescono a caricare e la pagina va in errore.

Non si tratta di un bug introdotto dalle ultime modifiche al codice: il codice è invariato, è l'infrastruttura del backend a essere sospesa.

## Cosa faccio

1. Riattivo il backend Lovable Cloud.
2. Attendo che risulti attivo e in salute.
3. Verifico che la homepage risponda correttamente (nessun errore 500) e che report, pubblicazioni e dashboard vengano caricati.
4. Se dopo la riattivazione restano errori, li diagnostico e li correggo.

## Dettagli tecnici

- Sintomo: `GET /` risponde 500 con `Error: fetch failed`; l'host del database non è raggiungibile dal server (DNS non risolve mentre il resto della rete funziona).
- Stato backend: `INACTIVE` (in pausa).
- Nessuna modifica al codice applicativo prevista: non vanno aggiunti workaround lato app per un backend sospeso.
