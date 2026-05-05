# EdilSync Development Plan

## Current state
- MVP funzionante con coordinamento contractor-homeowner per singoli progetti
- Screenshot del contesto Società mostra struttura base (info, membri)
- Progetto mobile-first, ma UX attualmente complessa per operai in cantiere
- Due direzioni di espansione identificate: Modalità Operativa (urgente) e Company Management (richiede validazione)

## Active phase: Design & prototype Operative Mode

### Constraint
La sfida critica è creare un'interfaccia radicalmente semplificata per operai che lavorano in cantiere sotto pressione (mani sporche, ambiente rumoroso, distrazioni), **mantenendo accesso a tutte le azioni** (foto, documentazione, status, blocchi) senza sopraccaricare visivamente.

Il rischio: un'interfaccia "ridotta" che sembra semplice ma in realtà nasconde funzionalità (affordances invisibili) o che non è davvero più veloce dell'interfaccia full. Deve essere sia minimalista che **intuitivo**.

### Completion criteria
- [ ] Layout prototipato con 4-5 schermate core per Modalità Operativa
- [ ] Flusso validato con 3-5 operai/team lead: "Riesci a fare questa azione in < 5 secondi?"
- [ ] Decisione su persistenza: è una view del sistema attuale, o una app separata (web app PWA)?
- [ ] Integrazione chiara: quando operaio agisce, come si riflette nel feed/timeline del contractor?

### Tasks
- [ ] Definire layout 4-5 schermate core basato su analisi UX (Home, Task detail, Photo upload, Status update, Activity feed minimalista)
- [ ] Prototipare in HTML/CSS/JS per test veloce
- [ ] Testare con 3-5 utenti: team lead + operai, in cantiere se possibile
- [ ] Documento: "Operative Mode spec" con flussi, schermate, integrazione backend
- [ ] Decidere tech stack (web view dentro app attuale vs standalone PWA vs app nativa)

---

## Future phases (directional)

### Phase 2: Company Management Validation
Once Operative Mode is shipped, validate company management features (timbratura, assegnazione lavori, calendario avanzato, magazzino) through interviews with 8-10 contractors to understand:
- What actual problem needs solving for teams managing multiple projects?
- Which 1-2 features are "must-have" vs "nice-to-have"?
- How to extend without losing EdilSync's core simplicity differentiator?

Output: Decision on which company features (if any) to build, in what sequence.

### Phase 3: Company Management MVP (conditional on Phase 2 validation)
Design and ship the validated company feature with proper integration into Operative Mode and contractor dashboard.

---

## Strategic notes
- **Operative Mode is core to MVP quality**: Without it, operai will continue using WhatsApp/text instead of EdilSync. This is a blocker for adoption in real teams.
- **Company management is speculative**: Built on assumption, not validated demand. Requires Phase 2 research before investment.
- **Positioning stays the same**: Both features reinforce protection-first + anti-complexity. Operative Mode = simplicity in practice. Company features = only if they solve real coordination pain.