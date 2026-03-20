# EdilSync - Pricing Phase 2 Authorization

## Scopo

La **Phase 2 - Make access server-authoritative** sposta la verita dei diritti dal frontend al database.

In questa fase non cambiamo ancora i flussi utente della modalita normale, ma introduciamo le funzioni SQL e le prime policy premium-aware necessarie per le fasi successive.

---

## Obiettivi della fase

1. Definire il piano effettivo di una societa lato database.
2. Definire lo stato effettivo di sponsorizzazione di un progetto lato database.
3. Risolvere l'accesso a una feature in modo centralizzato.
4. Applicare le prime protezioni premium sulle aree piu importanti:
   - milestone
   - economia di progetto
5. Rendere server-authoritative la possibilita di sponsorizzare un progetto.

---

## Funzioni introdotte

## Piano societa

- `resolve_company_plan_code(company_id)`
- `is_company_paid(company_id)`

Queste funzioni considerano paid solo una subscription non-free con `billing_status = 'active'`.

Questo e coerente con il contratto di prodotto:

- nessun grace period
- perdita accesso immediata quando la societa non e piu entitled

## Sponsorizzazione progetto

- `resolve_active_project_sponsor_company_id(project_id)`
- `is_project_sponsored(project_id)`
- `resolve_project_effective_plan_code(project_id)`

Queste funzioni permettono di trattare il progetto come:

- `free` se non sponsorizzato
- `paid` se sponsorizzato da una societa effettivamente paid

## Capability resolution

- `resolve_company_feature_access(company_id, feature_key)`
- `resolve_project_feature_access(project_id, feature_key)`
- `is_company_feature_enabled(company_id, feature_key)`
- `is_project_feature_enabled(project_id, feature_key)`

Queste funzioni leggono `app_features` e `plan_feature_rules` e costruiscono una risposta server-side unica.

Per le feature di progetto, il piano effettivo dipende dalla sponsorizzazione del progetto.

## Partecipazione e gestione

- `is_active_project_participant(project_id)`
- `can_current_user_read_project_milestones(project_id)`
- `can_current_user_manage_project_milestones(project_id)`
- `can_manage_company_billing(company_id)`
- `can_company_sponsor_project(company_id, project_id)`

`can_company_sponsor_project` richiede:

- admin della societa
- societa effettivamente paid
- societa gia partecipante attiva nel progetto

---

## Economia premium-aware

Le funzioni finance esistenti vengono ridefinite per tenere conto della sponsorizzazione.

### Logica aggiornata

Una persona puo vedere o gestire la finanza di progetto solo se:

1. il progetto ha la feature `project_finance` abilitata
2. il ruolo progettuale e coerente con la sezione finance

Quindi la Phase 2 separa chiaramente:

- **entitlement premium** del progetto
- **permessi di ruolo** dentro la sezione finance

Questo e esattamente il comportamento deciso in fase di progettazione.

---

## Milestone premium-aware

La feature `project_milestones` e premium.

In questa fase viene reso server-authoritative che:

- se la feature milestone non e attiva per quel progetto, le milestone non sono leggibili
- se la feature milestone non e attiva, non si possono creare o aggiornare milestone

La delete conserva una protezione prudente:

- serve il diritto di gestione milestone
- e inoltre l'azione resta limitata al creator o admin

---

## Sponsorizzazione server-authoritative

Le policy di `project_sponsorships` vengono rese piu forti.

Non basta piu essere admin di una societa qualunque.

Per creare, aggiornare o eliminare una sponsorizzazione serve che la societa:

- sia paid
- sia partecipante attiva del progetto
- sia amministrata dall'utente corrente

---

## Cosa questa fase NON fa ancora

La Phase 2 non implementa ancora:

- create project server-side con auto-sponsorizzazione
- invite participant server-side con regole homeowner/free/paid
- downgrade behavior applicativo completo
- gating frontend nella modalita normale
- UX sponsor card o tab Fatturazione

Queste parti arriveranno nelle fasi successive.

---

## Impatto sulle fasi successive

La Phase 3 usera queste funzioni per spostare i write sensibili dal FE al BE.

La Phase 4 usera le stesse funzioni come base per il gating lato UI.

La Phase 6 userea `company_subscriptions` e le funzioni piano/sponsorship per rendere effettiva l'integrazione Stripe.

---

## Risultato atteso della fase

Alla fine della Phase 2 il database e in grado di rispondere in modo affidabile a domande del tipo:

- questa societa e free o paid?
- questo progetto e sponsorizzato?
- quale feature e abilitata per questa societa?
- quale feature e abilitata per questo progetto?
- l'utente puo vedere milestone?
- l'utente puo vedere o gestire la finanza di progetto?
- questa societa puo sponsorizzare questo progetto?

Questo e il prerequisito per tutte le fasi applicative successive.