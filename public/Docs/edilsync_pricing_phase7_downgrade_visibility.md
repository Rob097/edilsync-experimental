# EdilSync - Pricing Phase 7 Downgrade And Premium Invisibility

## Scopo

La Phase 7 rende coerente il comportamento post-downgrade con il contratto pricing definito in Phase 0.

Il caso critico e questo:

- un progetto era premium grazie a una sponsorship
- la sponsorship smette di essere effettivamente valida
- il proprietario del progetto ha gia un altro progetto non sponsorizzato

In questa situazione il progetto non torna semplicemente free.
Entra invece nello stato speciale `blocked_for_sponsor_loss`.

Questo stato serve a evitare due regressioni di prodotto:

- continuare a mostrare superfici premium a un progetto che non ha piu diritto a usarle
- permettere al proprietario free di aggirare il limite di un solo progetto non sponsorizzato

---

## Implementazione backend

La logica server authoritative e stata aggiunta nella migration:

- `supabase/migrations/20260320150000_pricing_downgrade_visibility.sql`

### 1. Sponsor effettivo piu restrittivo

`resolve_active_project_sponsor_company_id(target_project_id)` non considera piu sufficiente la sola presenza di una riga attiva in `project_sponsorships`.

Una sponsorship e effettiva solo se la societa sponsor:

- ha ancora entitlement paid valido
- e ancora partecipante attivo del progetto come company participant

Questo impedisce che il progetto resti apparentemente premium quando il payer ha perso i requisiti reali.

### 2. Stato pricing progetto calcolato

La nuova funzione SQL `resolve_project_pricing_status(target_project_id)` restituisce uno stato strutturato con i campi principali:

- `status`
- `is_sponsored`
- `sponsor_company_id`
- `has_sponsorship_history`
- `has_other_unsponsored_owned_project`
- `premium_visibility_mode`
- `can_only_invite_companies`
- `reason_code`

Valori di `status` attualmente usati:

- `sponsored`
- `unsponsored`
- `blocked_for_sponsor_loss`

### 3. Helper booleano per enforcement rapido

La funzione SQL `is_project_blocked_for_sponsor_loss(target_project_id)` incapsula il controllo booleano usato nei punti di enforcement backend.

---

## Implementazione frontend

La UI legge ora il pricing runtime del progetto tramite:

- `src/hooks/useFeatureAccess.js`

Nuove aggiunte:

- `DEFAULT_PROJECT_PRICING_STATUS`
- `useProjectPricingStatus(projectId)`
- `isProjectBlockedForSponsorLoss(projectPricingStatus)`

Questa query e separata dalla normale feature resolution perche il problema non e solo "feature enabled o disabled", ma anche "quale modalita di visibilita deve avere l intera pagina progetto".

---

## Regole UI introdotte

### 1. Invisibilita premium nei progetti bloccati

In `src/pages/ProjectDetail.jsx`, quando lo stato e `blocked_for_sponsor_loss`:

- la pagina forza la navigazione su `info -> participants`
- le superfici premium e operative non vengono mostrate
- overview, lavori, chat, documenti ed economia non restano disponibili come viste normali
- le quick actions vengono nascoste

La pagina entra quindi in una modalita focalizzata sul recupero sponsorship.

### 2. Sponsorship card allineata allo stato effettivo

In `src/components/project/ProjectSponsorshipCard.jsx` la card non si basa piu soltanto sulla presenza di una sponsorship row attiva.

La card mostra invece:

- sponsorship effettiva quando presente
- badge e copy dedicati quando il progetto e bloccato per perdita sponsor
- messaggi piu espliciti sul fatto che la perdita entitlement del payer puo bloccare il progetto

### 3. Invite dialog orientato al recupero sponsor

In `src/components/project/InviteParticipantDialog.jsx`, quando il progetto e bloccato:

- il dialog forza il flusso verso inviti company
- non consente inviti personal
- mostra testo dedicato che spiega che il progetto puo invitare solo una societa sponsor per sbloccarsi

---

## Enforcement backend sugli inviti

La Edge Function aggiornata e:

- `inviteProjectParticipantWithValidation`

Regole aggiunte:

- se il progetto e `blocked_for_sponsor_loss`, sono consentiti solo inviti `participant_type = company`
- gli inviti personal vengono rifiutati server-side
- nel caso bloccato viene bypassata la vecchia restrizione "free company-owned non-sponsored project can invite only homeowner", per consentire il recovery path corretto verso una nuova societa sponsor

Questo e importante perche la sola UI non basta: il vincolo deve rimanere valido anche per chiamate dirette alla funzione.

---

## Deploy effettivamente completato

La migration Phase 7 e stata applicata al progetto Supabase reale `eeautkvckrbuorngkvyi`.

La Edge Function deployata con la logica aggiornata e:

- `inviteProjectParticipantWithValidation`

Da questo momento il comportamento downgrade/sponsor-loss e coerente sia a livello database sia nel path server-authoritative degli inviti.

---

## Stato finale di fase

La Phase 7 e implementata in normal mode.

Risultato operativo:

- la sponsorship di progetto e valutata in modo effettivo, non solo amministrativo
- i progetti che perdono sponsor non continuano a esporre superfici premium
- i progetti bloccati non possono proseguire come normali progetti free
- il recovery path consentito e esplicito: invitare una societa che possa sponsorizzare nuovamente il progetto