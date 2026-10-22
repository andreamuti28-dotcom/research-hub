# andreamuti.com

Sito personale di ricerca: paper, dashboard interattive, report di mercato e news.

## Architettura

| Pezzo | Dove | Note |
| --- | --- | --- |
| Codice | GitHub `andreamuti28-dotcom/research-hub` | Branch `main` = produzione |
| Hosting | Cloudflare Workers, Worker `research-hub` | Deploy automatico a ogni push su `main` (Workers Builds) |
| Dominio | `www.andreamuti.com` (canonico), `andreamuti.com` → 301 su www | DNS su Cloudflare |
| Database, login, file | Supabase, progetto `uxuxazeboaxcwxtkeiyj` (eu-central-1) | Tabelle con RLS, bucket pubblici `papers` e `site-assets` |
| Job pianificati | `pg_cron` in Supabase | `papers-auto-publish` ogni 5 minuti, `market-sync-hourly` al minuto 5 di ogni ora |

Stack: TanStack Start (React 19, SSR), Tailwind 4, shadcn/ui, Vite 7 con `@cloudflare/vite-plugin`.

## Configurazione

Valori pubblici, già nel repository:

- `.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` (finiscono nel bundle del browser)
- `wrangler.jsonc` → `vars`: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (lato server)

Secret, solo nel pannello Cloudflare (Workers & Pages → research-hub → Settings → Variables and Secrets), mai nel repository:

| Secret | Obbligatorio | A cosa serve |
| --- | --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Sì | Operazioni server (admin, contatori, archivio news, sync report). Supabase → Project Settings → API Keys |
| `GEMINI_API_KEY` | No | Impaginazione automatica del report di mercato e traduzioni di riserva. Senza, le traduzioni usano solo il motore gratuito e il report resta col layout del Google Doc. Chiave gratuita su aistudio.google.com |
| `MARKET_REPORTS_WEBHOOK_SECRET` | No | Solo se uno script esterno invia report a `/api/public/market-reports` |
| `AI_MODEL` | No | Modello Gemini, default `gemini-3.5-flash-lite` |

## Report di mercato

Il report viene letto dal Google Doc indicato in Admin → Market sync. Il documento deve essere condiviso come "Chiunque abbia il link" in sola lettura: il sito lo scarica dall'export pubblico di Google, senza credenziali. La frequenza si sceglie nella stessa pagina; il job `market-sync-hourly` chiama `/api/public/hooks/market-sync` e l'endpoint decide se la sincronizzazione è dovuta.

## Sviluppo

```sh
bun install
bun run dev        # sviluppo locale
bun run typecheck  # controllo TypeScript
bun run build      # build di produzione in dist/
```

Per lo sviluppo locale con dati veri, crea `.dev.vars` (ignorato da git) con `SUPABASE_SERVICE_ROLE_KEY=...`.

## Database

Le migrazioni sono in `supabase/migrations/` e rispecchiano quelle applicate al progetto Supabase. Ogni modifica allo schema passa da una nuova migrazione.

Le nuove registrazioni non ricevono mai il ruolo admin in automatico: il ruolo si assegna esplicitamente nella tabella `user_roles`. Conviene comunque tenere disattivate le registrazioni pubbliche in Supabase → Authentication → Sign In / Providers.
