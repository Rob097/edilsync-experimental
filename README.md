# EdilSync Experimental

Applicazione React + Vite con backend completo su Supabase (Postgres, RLS, Auth, Storage, Edge Functions).

## Stack

- Frontend: React, Vite, TanStack Query, Tailwind
- Backend: Supabase Postgres + RLS
- Auth: Supabase Auth
- Storage: bucket `project-files`
- Edge Functions:
  - `syncUserAccess`
  - `sendNotificationOrEmail`

## Requisiti

- Node.js 20+
- npm

## Configurazione ambiente

Creare `.env.local` (oppure `.env`) con:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<supabase-anon-or-publishable-key>
VITE_SUPABASE_AUTH_PROVIDER=google
```

## Avvio locale

```bash
npm install
npm run dev
```

Build produzione:

```bash
npm run build
npm run preview
```

## Migrazioni database

Le migrazioni sono in `supabase/migrations` e includono:

- schema applicativo
- policy RLS
- trigger di audit
- trigger di sincronizzazione accessi utente

## Edge Functions

### `syncUserAccess`

Sincronizza i campi di accesso utente (`company_ids`, `admin_company_ids`, `project_ids`) in base a membership e partecipazioni.

### `sendNotificationOrEmail`

Gestisce notifiche in-app e invio email.

Variabili supportate:

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `EMAIL_WEBHOOK_URL` (fallback se Resend non è configurato)

## Note operative

- Le automazioni di accesso sono gestite via trigger DB su `company_members` e `project_participants`.
- In caso di OAuth, ricordarsi di configurare in Supabase `Site URL` e `Redirect URLs` del dominio frontend.
- L’assistente `edilsync_assistant` è in modalità placeholder e può essere esteso con logica dedicata.
