# EdilSync

Web platform to coordinate residential construction and renovation projects. The idea is to keep the contractor, client, subcontractors and professionals all aligned in one place, with communications, decisions, tasks, appointments and documents always tracked, so delays, misunderstandings and disputes are reduced.

Live at [edilsync.rdlabs.digital](https://edilsync.rdlabs.digital/).

---

## Stack

- **Frontend:** React, Vite, TanStack Query, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, RLS, Auth, Storage, Edge Functions)
- **Auth:** Supabase Auth (Google OAuth)
- **Storage:** `project-files` bucket
- **Edge Functions:** `syncUserAccess`, `sendNotificationOrEmail`
- **Testing:** Vitest, Playwright

---

## Requirements

- Node.js 20+
- npm

If you use `nvm`, the repository includes `.nvmrc` — just run `nvm use`.

---

## Environment setup

Create a `.env.local` (or `.env`) file with:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<supabase-anon-or-publishable-key>
VITE_SUPABASE_AUTH_PROVIDER=google
```

`VITE_*` variables are always included in the frontend bundle and should never contain secrets, tokens or server-side keys. The app blocks startup if it detects variables matching patterns like `VITE_*SECRET*`, `VITE_*ACCESS_TOKEN*` or `VITE_*SERVICE_ROLE*`.

---

## Running locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

---

## Testing

All test-related documentation is in `tests/README.md`. Main commands:

```bash
npm run qa                      # full QA run
npm run test:unit               # unit tests (Vitest)
npm run test:integration:qa     # integration tests
npm run test:db                 # database tests (pgTAP)
npm run test:e2e                # end-to-end tests (Playwright)
npm run test:e2e:smoke          # smoke tests only
npm run test:all                # everything
```

Additional docs:
- `public/Docs/qa/README.md`
- `public/Docs/qa/scenario-matrix.md`
- `public/Docs/qa/vitest-backlog.md`
- `public/Docs/qa/playwright-backlog.md`

Test reports:
- `tests/reports/index.html`
- `tests/playwright-report/`
- `tests/test-results/`

---

## Database migrations

Migrations live in `supabase/migrations` and cover the application schema, RLS policies, audit triggers and related stored procedures.
