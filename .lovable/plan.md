# Nascondere il pannello admin a chi non è autorizzato

## Problema (verificato nel codice)

`src/routes/admin.index.tsx` controlla il ruolo admin lato client e, quando l'utente non ce l'ha, mostra il messaggio "Accesso non autorizzato" **dentro `AdminShell`**. `AdminShell` contiene la barra di navigazione completa del CMS (Recap, Nuovo Paper, Contenuti, News, Mercati, Dashboard, Utenti, Chiavi, Profilo): quindi la struttura del pannello resta visibile, come nello screenshot.

Nota importante: i dati non sono esposti — le server functions richiedono autenticazione e ruolo admin lato server. Il problema è di esposizione visiva della struttura interna, non di accesso ai dati.

## Cosa cambio

1. **Schermata di rifiuto senza chrome**: se l'utente è autenticato ma non è admin, mostro una pagina neutra a tutto schermo (solo messaggio + pulsante "Esci"), senza `AdminShell`, senza voci di menu, senza il logo "CMS". Stessa cosa per lo stato "Verifica accesso in corso…", così la navigazione non compare nemmeno per un istante durante il caricamento.

2. **Gate unico riutilizzabile**: creo un piccolo componente guard che incapsula "sessione presente + ruolo admin" e restituisce la pagina neutra in caso negativo. Lo applico a tutte le schermate admin, non solo a Recap, così nessuna rotta `/admin/*` mostra la barra a un utente non autorizzato.

3. **Redirect al login quando manca la sessione**: dove oggi manca, allineo il comportamento a `admin.index.tsx` (redirect a `/admin/login`), così un visitatore anonimo che digita `/admin/utenti` non vede mai la struttura del CMS.

Nessuna modifica a database, permessi o logica di business: le regole di sicurezza server-side restano quelle attuali.

## Dettagli tecnici

- Nuovo `src/components/AdminGuard.tsx`: query `user_roles` per `role = 'admin'`, stato di caricamento e stato negato resi come pagina full-screen senza `AdminShell`.
- `src/routes/admin.index.tsx`: sostituisce i due blocchi `AdminShell` di loading/denied con il guard.
- Le altre rotte `admin.*.tsx` avvolgono il contenuto nel guard e ricevono il `beforeLoad` con redirect a `/admin/login` se assente.
- Le rotte admin mantengono `robots: noindex,nofollow`.
