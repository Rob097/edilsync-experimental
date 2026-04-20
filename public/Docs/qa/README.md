# QA Coverage Index

Questa cartella contiene la parte di pianificazione e copertura dei test.
La guida operativa per avvio app, target `main`/`qa` e comando unico dei test e in `tests/README.md`.

## Obiettivo

- usare il branch `qa` come ambiente di verita per i test remoti
- coprire il 100% dei flussi di business del repo
- mantenere test e scenario matrix allineati a codice, migrazioni, edge functions e documentazione prodotto

## Documenti

- `tests/README.md`: guida operativa manuale per avvio e test
- `scenario-matrix.md`: catalogo canonico degli scenari da coprire
- `vitest-backlog.md`: backlog dei test unitari e di logica pura
- `integration-backlog.md`: backlog dei test di integrazione backend contro il branch `qa`
- `pgtap-backlog.md`: backlog dei test database e RLS con pgTAP
- `playwright-backlog.md`: backlog dei test browser contro frontend locale + backend `qa`

## Regole operative

1. Ogni nuova business rule deve avere uno `Scenario ID` nella matrice.
2. Ogni modifica a una business rule deve aggiornare almeno un test nel layer corretto.
3. Le stringhe di dominio non vanno duplicate nei test quando esiste gia una fonte canonica nel codice o nelle migrazioni.
4. La copertura richiesta e di business, non coverage cosmetica di linee irrilevanti.

## Fonti canoniche

- `public/Docs/edilsync_complete_application_map.md`
- `public/Docs/edil_sync_product_domain_overview.md`
- `public/Docs/edilsync_pricing_phase0_contract.md`
- `public/Docs/edilsync_pricing_phase1_schema.md`
- `public/Docs/edilsync_pricing_phase2_authorization.md`
- `public/Docs/edilsync_pricing_phase3_server_writes.md`
- `public/Docs/edilsync_pricing_phase4_frontend_gating.md`
- `public/Docs/edilsync_pricing_phase5_billing_sponsor_ux.md`
- `public/Docs/edilsync_pricing_phase6_stripe.md`
- `public/Docs/edilsync_pricing_phase7_downgrade_visibility.md`
- `src/pages.config.js`
- `src/operativa/OperativeAppRouter.jsx`
- `src/web-admin/WebAdminRouter.jsx`
- `src/public/PublicSiteRouter.jsx`
- `supabase/migrations/**`
- `supabase/functions/**`

## Convenzione Scenario ID

Formato consigliato:

`dominio.sottodominio.regola-comportamento`

Esempi:

- `auth.bootstrap.creates-public-user-record`
- `pricing.sponsor-loss.blocks-personal-invites`
- `notifications.message-mention.routes-to-project-chat`
- `operativa.context.denies-personal-user`