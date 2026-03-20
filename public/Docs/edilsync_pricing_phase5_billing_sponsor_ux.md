# EdilSync - Pricing Phase 5 Billing UX And Sponsor UX

## Scopo

La Phase 5 porta in UI normale le superfici commerciali gia preparate nelle fasi precedenti.

In questa fase diventano operativi:

- il tab `Fatturazione` nel dettaglio societa
- la card `Stato sponsorship progetto` nel dettaglio progetto
- i messaggi contestuali nella modale `Invita partecipante`

Restano volutamente fuori:

- checkout Stripe reale
- customer portal reale
- webhook Stripe

Questi punti arrivano nella Phase 6.

---

## Implementazione

## 1. Billing tab societa

Il dettaglio societa mostra ora un tab dedicato `Fatturazione`.

Vincoli rispettati:

- visibile solo agli admin della societa
- accessibile sia in contesto personale sia in contesto societa quando l utente apre quella societa
- alimentato dai dati reali di `company_subscriptions`

La sezione mostra:

- piano corrente
- billing status
- ciclo billing
- fine periodo corrente
- sponsorship attive della societa con link ai progetti sponsorizzati

Per il piano free la sezione espone CTA di upgrade coerenti ma ancora placeholder, perche il checkout non e stato collegato.

Per il piano paid la sezione espone la CTA al customer portal come placeholder strutturale in attesa della Phase 6.

## 2. Card sponsorship progetto

Il dettaglio progetto mostra ora la card sponsorship prima della descrizione progetto.

Stati coperti:

- progetto non sponsorizzato
- progetto sponsorizzato con nome societa sponsor e data di attivazione

Azioni coperte:

- info dialog `Cosa significa`
- attivazione sponsorship se l utente e admin di una societa paid gia partecipante al progetto
- CTA verso billing societa se l utente e admin di una societa free partecipante
- terminazione sponsorship se l utente e admin della societa sponsor

La scrittura usa le policy e le funzioni autorizzative introdotte in Phase 2, quindi la UI non introduce bypass applicativi.

## 3. Messaggi contestuali invito partecipante

La modale `Invita partecipante` mostra ora messaggi distinti per inviti verso societa in base a:

- progetto sponsorizzato + societa free
- progetto non sponsorizzato + societa free
- progetto non sponsorizzato + societa paid

Il caso progetto sponsorizzato + societa paid non mostra messaggi aggiuntivi, come da contratto congelato.

---

## Dettagli tecnici

## Entita client aggiunte al mapper

- `CompanySubscription`
- `ProjectSponsorship`

Questo permette alla UI normale di leggere e aggiornare le tabelle gia introdotte nelle migrazioni pricing.

## Nuovi componenti

- `src/components/company/CompanyBillingSection.jsx`
- `src/components/project/ProjectSponsorshipCard.jsx`
- `src/lib/subscriptions.js`

## Wiring aggiornato

- `src/pages/CompanyDetail.jsx`
  - nuovo tab billing
  - quick actions verso billing
- `src/pages/ProjectDetail.jsx`
  - card sponsorship inserita prima della descrizione
- `src/components/project/InviteParticipantDialog.jsx`
  - messaggi dinamici in base a sponsorship progetto e piano societa invitata

---

## Stato finale di fase

La UX di billing e sponsorship e ora spedita in modalita normale.

La parte commerciale e leggibile e azionabile dove possibile gia oggi:

- sponsorship progetto attivabile e terminabile
- billing state visibile agli admin societa
- CTA upgrade e portal posizionate in UI

Il collegamento ai flussi Stripe reali resta il prossimo step naturale della rollout.