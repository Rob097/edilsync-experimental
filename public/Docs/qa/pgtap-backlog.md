# pgTAP Backlog

Questa lista raccoglie i test da implementare direttamente nel database QA con `pgTAP`.

## Obiettivo del layer

- bloccare regressioni su schema, RLS, trigger, RPC e vincoli
- validare i contratti server-side anche quando la UI cambia
- rendere verificabili pricing, sponsorship e security invariants

## Suite da implementare

### Schema e pricing foundation

1. Estendere la suite foundation per verificare:
   - tabelle `company_subscriptions`, `project_sponsorships`, `app_features`, `plan_feature_rules`, `stripe_events`
   - indici su plan_code, billing_status, sponsor_company_id
   - unique index `one_active_per_project`
   - colonne attese e vincoli check
2. Verificare seed `app_features` e `plan_feature_rules`:
   - tutte le feature company
   - tutte le feature project
   - `free` e `paid` con access levels attesi

### RPC pricing e sponsor loss

3. `resolve_company_plan_code()`:
   - free
   - paid active
   - paid past_due
4. `is_company_paid()`:
   - true solo per paid active
5. `resolve_company_feature_access()`:
   - enabled
   - limited
   - disabled
6. `resolve_project_feature_access()`:
   - progetto sponsorizzato
   - progetto non sponsorizzato
   - progetto con sponsor non valido
7. `resolve_project_pricing_status()`:
   - `sponsored`
   - `unsponsored`
   - `blocked_for_sponsor_loss`
   - `can_only_invite_companies`
   - `premium_visibility_mode`

### RLS e security invariants

8. RLS `company_subscriptions`:
   - admin societa legge/aggiorna
   - member societa non admin non aggiorna
   - utente esterno non legge
9. RLS `project_sponsorships`:
   - project participant legge
   - sponsor company admin legge/aggiorna
   - utente esterno non legge
10. RLS `notification_preferences`:
   - owner legge e aggiorna
   - admin piattaforma legge
   - altro utente non accede
11. Trigger protezione `public.users`:
   - utente autenticato non puo alterare `role`
   - utente autenticato non puo alterare `company_ids`
   - utente autenticato non puo alterare `project_ids`
   - service role puo operare

### Finance, work sessions, documents

12. `work_sessions`:
   - una sola sessione aperta per user/company
   - `ended_at >= started_at`
   - visibilita RLS coerente
13. `cost_entries`:
   - un solo cost entry per `work_session`
   - sorgente `work_session` coerente
14. `project_financial_settings` e tabelle finance:
   - visibilita predefinita
   - integrita tra budget lines, labor rates, progress statements e commercials
15. `project_documents`:
   - `root_document_id` e `revision_number` calcolati correttamente
   - unica current revision per root
   - eventi `document_created`, `revision_created`, `file_replaced`, `status_changed`, `metadata_updated`
16. BIM premium enforcement:
   - blocco upload IFC/GLB/GLTF senza entitlement
   - permesso upload con entitlement attivo

### Rate limit e audit

17. `consume_rate_limit`:
   - crea bucket
   - incrementa bucket
   - resetta bucket su nuova finestra
   - rifiuta dopo soglia
18. Audit fields:
   - `created_date`
   - `updated_date`
   - `created_by`

## Regole di implementazione

1. Ogni suite deve essere focalizzata su un contratto server-side preciso.
2. Le fixture devono essere ridotte al minimo necessario per evitare test fragili.
3. Quando una business rule e gia espressa in una migration o RPC, il suo test autorevole deve vivere qui.