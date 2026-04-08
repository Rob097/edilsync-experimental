# EdilSync - Pricing Phase 6 Stripe Integration

## Scopo

La Phase 6 collega il modello pricing gia reso autoritativo in Supabase ai flussi Stripe in modalita test.

In questa fase diventano operativi:

- il checkout Stripe per upgrade societa free -> paid
- il customer portal Stripe per la gestione del subscription lifecycle
- il webhook Stripe che sincronizza lo stato reale del subscription record verso `company_subscriptions`

La sorgente di verita del diritto di accesso resta Supabase.

Stripe non decide direttamente cosa un utente puo fare in app.
Stripe aggiorna lo stato commerciale e Supabase traduce quello stato nelle capability gia introdotte in Phase 2 e Phase 4.

---

## Implementazione

## 1. Checkout session per upgrade societa

La UI di fatturazione societa usa ora una Edge Function autenticata per creare una Stripe Checkout Session in modalita `subscription`.

Funzione deployata:

- `createStripeCheckoutSession`

Responsabilita principali:

- valida che il chiamante sia admin della societa
- accetta `company_id`, `billing_cycle`, `return_url`
- riusa o crea il customer Stripe della societa
- seleziona il prezzo Stripe mensile o annuale
- crea la Checkout Session con metadata `company_id`
- salva o aggiorna il record `company_subscriptions` con i riferimenti Stripe noti gia in fase di checkout

Configurazione richiesta via environment variables server-side:

- prodotto `EdilSync PRO` -> `STRIPE_PRODUCT_ID`
- mensile `19 EUR` -> `STRIPE_PRICE_MONTHLY`
- annuale `190 EUR` -> `STRIPE_PRICE_YEARLY`

## 2. Billing portal per societa gia collegate a Stripe

La UI di fatturazione societa usa ora una Edge Function autenticata per aprire il customer portal Stripe.

Funzione deployata:

- `createStripeBillingPortalSession`

Responsabilita principali:

- valida che il chiamante sia admin della societa
- richiede una societa gia collegata a uno `stripe_customer_id`
- crea una portal session con return URL verso la UI applicativa

Questo sposta fuori dal frontend la logica sensibile di gestione sessioni Stripe.

## 3. Webhook Stripe pubblico e idempotente

La sincronizzazione definitiva dello stato subscription avviene tramite webhook.

Funzione deployata:

- `handleStripeWebhook`

Configurazione di sicurezza:

- `verify_jwt = false`
- verifica della firma tramite `STRIPE_WEBHOOK_SIGNING_SECRET`
- uso del raw request body per la verifica della signature

Persistenza e idempotenza:

- ogni evento viene registrato in `stripe_events`
- gli eventi gia marcati `processed = true` non vengono rieseguiti
- gli errori vengono persistiti in `error_message`

Eventi gestiti:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

## 4. Sincronizzazione stato commerciale -> entitlement

La logica di sync traduce lo stato Stripe nel record locale `company_subscriptions`.

Mappatura implementata:

- `active` e `trialing` -> `plan_code = paid`, `billing_status = active`
- `past_due` -> `plan_code = paid`, `billing_status = past_due`
- `unpaid` e `paused` -> `plan_code = paid`, `billing_status = unpaid`
- `incomplete` -> `plan_code = paid`, `billing_status = incomplete`
- `canceled` e `incomplete_expired` -> `plan_code = free`, `billing_status = canceled`

Questa scelta e coerente con la Phase 2, dove la capability effettiva paid dipende da:

- `plan_code <> free`
- `billing_status = active`

Di conseguenza:

- uno stato non entitled non sblocca feature premium
- quando la societa perde entitlement vengono terminate automaticamente le sponsorship progetto attive di quella societa

---

## Frontend collegato

La sezione `CompanyBillingSection` e ora collegata ai flussi Stripe reali in sandbox.

Comportamenti aggiunti:

- selezione ciclo `monthly` o `yearly`
- redirect verso Stripe Checkout per upgrade
- redirect verso Stripe Billing Portal per gestione abbonamento
- gestione del ritorno in app tramite query params
- invalidazione query per riallineare stato billing e capability dopo il ritorno

---

## Deploy effettivamente completato

Edge Function deployate sul progetto Supabase reale `eeautkvckrbuorngkvyi`:

- `createStripeCheckoutSession`
- `createStripeBillingPortalSession`
- `handleStripeWebhook`

Endpoint webhook da registrare in Stripe:

- `https://eeautkvckrbuorngkvyi.supabase.co/functions/v1/handleStripeWebhook`

---

## Prerequisiti runtime fuori dal repo

Per il funzionamento end to end servono i secret runtime Supabase.

Minimi richiesti:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SIGNING_SECRET`

Opzionali ma consigliati per evitare fallback hardcoded:

- `STRIPE_PRODUCT_ID`
- `STRIPE_PRICE_MONTHLY`
- `STRIPE_PRICE_YEARLY`

Se questi valori opzionali non sono presenti, le funzioni usano i resource id test gia verificati in Stripe sandbox.

---

## Stato finale di fase

La Phase 6 e implementata nel codice e deployata lato Supabase.

Da questo momento il prodotto ha la catena tecnica completa per billing test mode:

- CTA upgrade societa -> Stripe Checkout
- gestione subscription -> Stripe Customer Portal
- sincronizzazione server authoritative -> Stripe Webhook -> `company_subscriptions`
- ricalcolo capability premium attraverso l infrastruttura Supabase gia introdotta nelle fasi precedenti

L attivazione operativa completa dipende solo dal collegamento del webhook Stripe all endpoint deployato e dalla presenza dei secret runtime Stripe nel progetto Supabase.