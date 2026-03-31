import React, { useRef } from 'react';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import StructuredData from '@/public/seo/StructuredData';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import usePublicGsap from '@/public/hooks/usePublicGsap';

const pageMap = {
  funzionalita: {
    it: {
      eyebrow: 'Piattaforma',
      title: 'La suite operativa per cantieri che vogliono controllo e protezione.',
      subtitle: 'Ogni modulo è pensato per ridurre il caos operativo e prevenire dispute prima che diventino un costo.',
      challenges: [
        'Informazioni critiche sparse tra chat, chiamate e file personali.',
        'Varianti e approvazioni non formalizzate in modo verificabile.',
        'Difficoltà nel capire chi è responsabile di blocchi e ritardi.',
      ],
      modules: [
        { title: 'Task + Milestone', text: 'Board e timeline collegate, assegnazioni per persona o società e stato blocked con causa documentata.' },
        { title: 'Documenti + Revisioni', text: 'Repository tecnico con commenti, versioni e metadati utili anche sul campo.' },
        { title: 'Change Request', text: 'Workflow approvativo con impatto economico e temporale per eliminare zone grigie.' },
        { title: 'Dispute Center', text: 'Apertura casi, eventi, prove e note di risoluzione nello stesso contesto del progetto.' },
        { title: 'Calendar + Eventi', text: 'Unifica eventi e scadenze task per ridurre conflitti di pianificazione.' },
        { title: 'Finance operativo', text: 'Budget, costi, SAL e sincronizzazione manodopera con permessi granulari.' },
      ],
      workflow: ['Imposti progetto e partecipanti contestuali.', 'Coordini lavoro e documentazione in tempo reale.', 'Gestisci extra e approvazioni in modo tracciabile.', 'Se emerge un conflitto, hai già timeline ed evidenze.'],
      outcomes: ['Meno rilavorazioni da incomprensione.', 'Meno esposizione legale su scope e ritardi.', 'Più fiducia tra impresa, committente e tecnici.'],
      faq: [
        { q: 'EdilSync sostituisce WhatsApp?', a: 'Per il progetto sì: conversazioni, documenti e decisioni restano nel contesto giusto.' },
        { q: 'Posso usarlo anche da mobile?', a: 'Sì, con superfici operative pensate per l’uso in cantiere.' },
      ],
      primaryCta: { href: '/contatti', label: 'Richiedi una demo guidata' },
      secondaryCta: { href: '/contractors', label: 'Vedi percorso imprese' },
    },
    en: {
      eyebrow: 'Platform',
      title: 'An operational suite built for control, speed, and dispute protection.',
      subtitle: 'Each module is designed to reduce execution chaos and prevent margin-killing conflicts.',
      challenges: [
        'Critical information fragmented across chats, calls, and personal files.',
        'Scope changes and approvals missing verifiable tracking.',
        'Unclear accountability for blockers and delays.',
      ],
      modules: [
        { title: 'Tasks + Milestones', text: 'Connected board and timeline with blocked-state accountability.' },
        { title: 'Documents + Revisions', text: 'Technical repository with comments, versions, and field-ready metadata.' },
        { title: 'Change Requests', text: 'Approval workflow with cost and schedule impact tracking.' },
        { title: 'Dispute Center', text: 'Case timeline, events, evidence, and resolution notes in one context.' },
        { title: 'Calendar + Events', text: 'Unified event and task schedule to reduce coordination conflicts.' },
        { title: 'Operational Finance', text: 'Budget, costs, and progress statements with granular permissions.' },
      ],
      workflow: ['Set up projects with contextual participants.', 'Coordinate work and documentation in real time.', 'Formalize scope changes and approvals.', 'If conflict appears, evidence is already structured.'],
      outcomes: ['Less rework from unclear communication.', 'Lower legal and financial exposure.', 'Higher trust across project stakeholders.'],
      faq: [
        { q: 'Does EdilSync replace WhatsApp for projects?', a: 'Yes. Project communication stays linked to tasks, docs, and approvals.' },
        { q: 'Can teams use it on-site?', a: 'Yes, including mobile-first operational experiences.' },
      ],
      primaryCta: { href: '/en/contatti', label: 'Request a guided demo' },
      secondaryCta: { href: '/en/contractors', label: 'See contractor path' },
    },
  },
  'per-imprese': {
    it: {
      eyebrow: 'Per imprese',
      title: 'Proteggi margine e reputazione, mentre coordini il cantiere in modo più veloce.',
      subtitle: 'EdilSync nasce dai problemi reali delle imprese: dispute sugli extra, blocchi non tracciati, responsabilità ambigue.',
      challenges: [
        'Dispute su "pensavo fosse incluso" che erodono profitto.',
        'Subappaltatori non allineati e viaggi a vuoto.',
        'Ritardi imputati all’impresa senza prove contestuali.',
      ],
      modules: [
        { title: 'Timeline di prova', text: 'Ogni azione critica viene registrata con data, autore e contesto operativo.' },
        { title: 'Task blocked con responsabilità', text: 'Documenti blocchi e cause per evitare colpe improprie.' },
        { title: 'Varianti formalizzate', text: 'Richieste e approvazioni con impatto su costo e tempi in chiaro.' },
        { title: 'Coordinamento multi-ruolo', text: 'Impresa, committente, tecnici e subappalti allineati in un solo sistema.' },
      ],
      workflow: ['Avvii progetto da contesto aziendale.', 'Inviti committente e partner con ruoli coerenti.', 'Gestisci operatività quotidiana con tracciamento nativo.', 'Difendi decisioni e margine quando nasce una contestazione.'],
      outcomes: ['Riduzione degli attriti su scope e pagamenti.', 'Maggiore controllo sui tempi reali di esecuzione.', 'Percezione professionale più forte verso il cliente.'],
      faq: [
        { q: 'Quanto tempo serve per partire?', a: 'L’onboarding è guidato ed è pensato per un’adozione rapida, anche per team poco digitalizzati.' },
        { q: 'Posso coinvolgere il committente senza complicare il flusso?', a: 'Sì, con accessi contestuali e visibilità calibrata.' },
      ],
      primaryCta: { href: '/contatti', label: 'Prenota demo per impresa' },
      secondaryCta: { href: '/come-funziona', label: 'Scopri il workflow' },
    },
    en: {
      eyebrow: 'For contractors',
      title: 'Protect margin and reputation while running projects with less friction.',
      subtitle: 'EdilSync targets contractor pain directly: scope disputes, untracked blockers, and blurred accountability.',
      challenges: [
        'Scope confusion that destroys already-thin margins.',
        'Subcontractor misalignment and wasted site visits.',
        'Delays blamed on the contractor without evidence.',
      ],
      modules: [
        { title: 'Evidence timeline', text: 'Every critical action is logged with actor, time, and context.' },
        { title: 'Blocked-task accountability', text: 'Document blockers and causes to avoid unfair blame.' },
        { title: 'Structured change requests', text: 'Capture approvals with clear schedule and cost impact.' },
        { title: 'Multi-role coordination', text: 'Contractor, owner, technical roles, and subs in one shared flow.' },
      ],
      workflow: ['Start projects from company context.', 'Invite owners and partners with coherent roles.', 'Run daily operations with native traceability.', 'Defend margin and decisions when conflict appears.'],
      outcomes: ['Fewer conflicts over scope and payment.', 'Better control over real delivery timelines.', 'Stronger client trust and professional positioning.'],
      faq: [
        { q: 'How quickly can we onboard?', a: 'Guided onboarding is designed for fast adoption, including non-technical teams.' },
        { q: 'Can owners collaborate without adding chaos?', a: 'Yes, with contextual access and calibrated visibility.' },
      ],
      primaryCta: { href: '/en/contatti', label: 'Book contractor demo' },
      secondaryCta: { href: '/en/come-funziona', label: 'View workflow' },
    },
  },
  'per-committenti': {
    it: {
      eyebrow: 'Per committenti',
      title: 'Trasparenza continua sul cantiere, senza inseguire aggiornamenti.',
      subtitle: 'Vedi avanzamento, decisioni e richieste in modo ordinato, con uno storico che riduce ansia e incomprensioni.',
      challenges: ['Aggiornamenti sporadici e poco affidabili.', 'Difficoltà nel capire perché il progetto rallenta.', 'Extra economici discussi in modo ambiguo.'],
      modules: [
        { title: 'Feed progetto', text: 'Cronologia leggibile di progressi, blocchi, documenti e decisioni.' },
        { title: 'Richieste e approvazioni', text: 'Ogni cambio scope viene registrato con esito e motivazione.' },
        { title: 'Documentazione accessibile', text: 'Niente file persi: tutto resta collegato al progetto.' },
      ],
      workflow: ['Ricevi invito al progetto.', 'Segui stato e prossime attività.', 'Approvi o chiarisci varianti.', 'Collabori con impresa e tecnici su dati condivisi.'],
      outcomes: ['Meno stress e meno sorprese finali.', 'Più chiarezza su costi e tempi.', 'Maggiore fiducia nel team che esegue i lavori.'],
      faq: [{ q: 'Serve esperienza tecnica?', a: 'No. La lettura del progetto è orientata a chiarezza e decisioni pratiche.' }],
      primaryCta: { href: '/contatti', label: 'Richiedi una demo' },
      secondaryCta: { href: '/faq', label: 'Leggi FAQ' },
    },
    en: {
      eyebrow: 'For homeowners',
      title: 'Clear project visibility without chasing updates.',
      subtitle: 'Track progress, decisions, and requests in one timeline built to reduce anxiety and confusion.',
      challenges: ['Inconsistent status updates.', 'Unclear reasons behind delays.', 'Ambiguous scope and extra costs.'],
      modules: [
        { title: 'Project feed', text: 'Readable timeline of progress, blockers, files, and decisions.' },
        { title: 'Requests and approvals', text: 'Scope changes with documented status and rationale.' },
        { title: 'Always-on documentation', text: 'No scattered files, everything stays tied to project context.' },
      ],
      workflow: ['Join the project workspace.', 'Track status and upcoming work.', 'Approve or clarify changes.', 'Collaborate with contractor and technical roles from shared facts.'],
      outcomes: ['Less stress and fewer surprises.', 'Clearer time and cost expectations.', 'Stronger confidence in project delivery.'],
      faq: [{ q: 'Do I need technical expertise?', a: 'No. The experience is designed for clarity and practical decisions.' }],
      primaryCta: { href: '/en/contatti', label: 'Request demo' },
      secondaryCta: { href: '/en/faq', label: 'Read FAQ' },
    },
  },
  'per-subappaltatori': {
    it: {
      eyebrow: 'Per subappaltatori',
      title: 'Contesto giusto al momento giusto, per lavorare senza attriti.',
      subtitle: 'Riduci chiamate ridondanti e allineamenti tardivi con un accesso operativo chiaro.',
      challenges: ['Informazioni arrivate tardi.', 'Sopralluoghi senza condizioni pronte.', 'Poca visibilità su dipendenze tra squadre.'],
      modules: [
        { title: 'Task assegnati con contesto', text: 'Sai esattamente cosa fare, dove e con quali prerequisiti.' },
        { title: 'Calendario condiviso', text: 'Vedi finestre operative e cambi programma in tempo utile.' },
        { title: 'Comunicazione tracciata', text: 'Messaggi legati al progetto, non thread dispersi.' },
      ],
      workflow: ['Ricevi invito del contractor.', 'Accedi alle attività rilevanti.', 'Condividi avanzamenti e blocchi.', 'Chiudi il lavoro con prove e storico.'],
      outcomes: ['Meno viaggi a vuoto.', 'Migliore puntualità operativa.', 'Riduzione degli errori da coordinamento.'],
      faq: [{ q: 'Vedo solo ciò che mi serve?', a: 'Sì, il perimetro è contestuale al ruolo e alla partecipazione attiva.' }],
      primaryCta: { href: '/contatti', label: 'Parla con noi' },
      secondaryCta: { href: '/funzionalita', label: 'Esplora piattaforma' },
    },
    en: {
      eyebrow: 'For subcontractors',
      title: 'Get the right context at the right moment to execute reliably.',
      subtitle: 'Reduce redundant calls and late coordination with scoped operational access.',
      challenges: ['Late information handoff.', 'Site visits before prerequisites are ready.', 'Low visibility on cross-team dependencies.'],
      modules: [
        { title: 'Contextual task assignments', text: 'Know exactly what to do, where, and with what prerequisites.' },
        { title: 'Shared calendar', text: 'See execution windows and updates before they cause waste.' },
        { title: 'Traceable communication', text: 'Project-linked communication instead of scattered threads.' },
      ],
      workflow: ['Get invited by the contractor.', 'Access relevant work packages.', 'Share progress and blockers.', 'Close work with traceable evidence.'],
      outcomes: ['Fewer wasted trips.', 'Stronger schedule reliability.', 'Fewer coordination-driven mistakes.'],
      faq: [{ q: 'Will I only see relevant scope?', a: 'Yes, access is contextual to role and active participation.' }],
      primaryCta: { href: '/en/contatti', label: 'Talk to us' },
      secondaryCta: { href: '/en/funzionalita', label: 'Explore platform' },
    },
  },
  'per-tecnici': {
    it: {
      eyebrow: 'Per tecnici',
      title: 'Dalla revisione tecnica alla realtà di cantiere, senza disconnessioni.',
      subtitle: 'Architetti, ingegneri e consulenti collaborano su documenti, varianti e stato lavori nello stesso sistema.',
      challenges: ['Revisioni tecniche non allineate con esecuzione.', 'Commenti e file dispersi in più strumenti.', 'Decisioni senza trail verificabile.'],
      modules: [
        { title: 'Documentazione revisionata', text: 'Versioni, metadati e commenti per disciplina, area e fase.' },
        { title: 'Richieste contestuali', text: 'Varianti e chiarimenti collegati direttamente al progetto.' },
        { title: 'Collaborazione multi-attore', text: 'Impresa, committente e tecnici lavorano su un unico stato di verità.' },
      ],
      workflow: ['Accedi al progetto come professionista.', 'Revisioni e confronti restano tracciati.', 'Allinei decisioni tecniche e avanzamento.', 'Riduci attriti e rilavorazioni.'],
      outcomes: ['Maggiore coerenza tra progetto e realizzazione.', 'Meno errori da documenti non aggiornati.', 'Più chiarezza su responsabilità tecniche.'],
      faq: [{ q: 'Posso usare EdilSync anche solo per parte documentale?', a: 'Sì, ma il valore cresce quando documenti e operatività restano collegate.' }],
      primaryCta: { href: '/contatti', label: 'Richiedi demo tecnica' },
      secondaryCta: { href: '/blog', label: 'Approfondisci nel blog' },
    },
    en: {
      eyebrow: 'For technical professionals',
      title: 'From technical revision to site execution, fully connected.',
      subtitle: 'Architects, engineers, and consultants collaborate on documents, change logic, and execution state in one system.',
      challenges: ['Technical revisions disconnected from field execution.', 'Comments and files fragmented across tools.', 'Decisions without verifiable history.'],
      modules: [
        { title: 'Revision-controlled documentation', text: 'Versions, metadata, and comments by discipline and phase.' },
        { title: 'Contextual requests', text: 'Change requests and clarifications connected to project reality.' },
        { title: 'Multi-actor collaboration', text: 'Contractor, owner, and technical roles aligned on one source of truth.' },
      ],
      workflow: ['Join the project as a technical participant.', 'Track revisions and technical decisions.', 'Align design intent with site execution.', 'Reduce conflict and rework.'],
      outcomes: ['Higher design-to-site consistency.', 'Fewer mistakes from outdated files.', 'Clearer accountability in technical decisions.'],
      faq: [{ q: 'Can I start with document workflows only?', a: 'Yes, but value compounds when documentation and execution stay linked.' }],
      primaryCta: { href: '/en/contatti', label: 'Request technical demo' },
      secondaryCta: { href: '/en/blog', label: 'Read blog insights' },
    },
  },
  'come-funziona': {
    it: {
      eyebrow: 'Workflow',
      title: 'Un flusso operativo end-to-end, pensato per cantieri reali.',
      subtitle: 'Dalla creazione progetto alla gestione conflitti: ogni passaggio rimane coerente e verificabile.',
      challenges: ['Kickoff disordinato e ruoli non chiari.', 'Operatività scollegata da richieste e documenti.', 'Conflitti gestiti quando è troppo tardi.'],
      modules: [
        { title: '1. Setup contestuale', text: 'Definisci owner, partecipanti e ruoli in base al contesto attivo.' },
        { title: '2. Esecuzione quotidiana', text: 'Task, milestone, chat, documenti e calendario allineati.' },
        { title: '3. Gestione cambi', text: 'Ogni extra passa da richiesta, risposta e storico approvativo.' },
        { title: '4. Chiusura dispute', text: 'Se serve, apri un caso con eventi ed evidenze già raccolte.' },
      ],
      workflow: ['Kickoff', 'Coordinamento', 'Formalizzazione extra', 'Difesa operativa'],
      outcomes: ['Ciclo decisionale più veloce.', 'Meno attrito tra soggetti coinvolti.', 'Meno rischio di contenzioso aperto.'],
      faq: [{ q: 'È adatto anche a progetti piccoli?', a: 'Sì, soprattutto dove la comunicazione pesa molto sul risultato finale.' }],
      primaryCta: { href: '/contatti', label: 'Prenota una demo' },
      secondaryCta: { href: '/contractors', label: 'Vai a Per imprese' },
    },
    en: {
      eyebrow: 'Workflow',
      title: 'An end-to-end project flow designed for real construction work.',
      subtitle: 'From setup to dispute handling, each step remains coherent and auditable.',
      challenges: ['Messy kickoff and unclear role ownership.', 'Daily execution disconnected from approvals and documents.', 'Conflicts addressed too late.'],
      modules: [
        { title: '1. Context setup', text: 'Define owner, participants, and roles with contextual logic.' },
        { title: '2. Daily execution', text: 'Tasks, milestones, docs, chat, and calendar stay aligned.' },
        { title: '3. Change handling', text: 'Every extra follows a request-response trail.' },
        { title: '4. Dispute handling', text: 'When needed, open a case with existing event and evidence history.' },
      ],
      workflow: ['Kickoff', 'Execution', 'Change formalization', 'Operational defense'],
      outcomes: ['Faster decisions.', 'Lower stakeholder friction.', 'Reduced legal exposure.'],
      faq: [{ q: 'Is this suitable for smaller projects?', a: 'Yes, especially where communication quality drives project outcomes.' }],
      primaryCta: { href: '/en/contatti', label: 'Book a demo' },
      secondaryCta: { href: '/en/contractors', label: 'Go to contractor page' },
    },
  },
  prezzi: {
    it: {
      eyebrow: 'Prezzi',
      title: 'Prezzi chiari, adozione rapida, nessuna promessa fragile.',
      subtitle: 'EdilSync usa un modello esplicito: privati sempre free, società free o paid, strumenti avanzati di progetto attivati tramite sponsorship attiva.',
      challenges: ['Prezzi a utente che crescono senza controllo.', 'Costi nascosti su moduli separati e integrazioni.', 'Onboarding lento che blocca l’adozione operativa.'],
      modules: [
        { title: 'Società free o paid', text: 'La società può partire free e passare a Pro quando deve sbloccare la sponsorship e gli strumenti avanzati dell’impresa.' },
        { title: 'Sponsorship progetto', text: 'Gli strumenti avanzati di progetto non dipendono dal ruolo contractor: dipendono dalla società paid che sponsorizza il progetto.' },
        { title: 'Accesso gratuito su invito', text: 'Committente, subappaltatori e professionisti entrano gratis nei progetti invitati mantenendo lo stesso contesto operativo.' },
      ],
      workflow: ['Attivi progetto e partecipanti', 'Configuri flusso operativo principale', 'Lanci task, documenti e approvazioni', 'Consolidi il coordinamento in pochi giorni'],
      outcomes: ['Costi prevedibili fin da subito.', 'Adozione più veloce sul campo.', 'Ritorno immediato su tempo e coordinamento.'],
      faq: [{ q: 'Come si sbloccano gli strumenti avanzati di progetto?', a: 'Con una sponsorship attiva da parte di una società paid che partecipa al progetto.' }],
      primaryCta: { href: '/contatti', label: 'Parla con il team' },
      secondaryCta: { href: '/faq', label: 'Domande frequenti' },
    },
    en: {
      eyebrow: 'Pricing',
      title: 'Clear pricing, fast adoption, no fragile promises.',
      subtitle: 'EdilSync uses an explicit model: private owners stay free, companies are free or paid, and project premium unlocks through active sponsorship.',
      challenges: ['Per-user pricing that grows out of control.', 'Hidden costs across separate modules and add-ons.', 'Slow onboarding that delays operational adoption.'],
      modules: [
        { title: 'Free or paid company', text: 'A company can start free and upgrade to Pro when it needs sponsorship and company premium.' },
        { title: 'Project sponsorship', text: 'Project premium does not depend on a contractor label: it depends on the paid company that sponsors the project.' },
        { title: 'Free invited access', text: 'Homeowners, subcontractors, and professionals can join invited projects for free while keeping project context.' },
      ],
      workflow: ['Activate project and participants', 'Configure primary operational flow', 'Launch tasks, docs, and approvals', 'Stabilize coordination in days'],
      outcomes: ['Predictable costs from day one.', 'Faster field adoption.', 'Immediate return on time and coordination.'],
      faq: [{ q: 'How do premium project features unlock?', a: 'Through an active sponsorship from a paid company participating in the project.' }],
      primaryCta: { href: '/en/contatti', label: 'Talk to the team' },
      secondaryCta: { href: '/en/faq', label: 'FAQ' },
    },
  },
  faq: {
    it: {
      eyebrow: 'FAQ',
      title: 'Risposte rapide alle domande più frequenti.',
      subtitle: 'Se hai un caso specifico, prepariamo una demo costruita sul tuo flusso reale.',
      challenges: [],
      modules: [],
      workflow: [],
      outcomes: [],
      faq: [
        { q: 'EdilSync è adatto a team piccoli?', a: 'Sì, è stato pensato proprio per realtà operative con tempi stretti e risorse limitate.' },
        { q: 'Serve formazione lunga?', a: 'No. L’onboarding guidato punta a far partire subito i flussi critici.' },
        { q: 'Posso invitare committente e subappaltatori?', a: 'Sì, con accessi contestuali e perimetro dati controllato.' },
        { q: 'Funziona da smartphone?', a: 'Sì, inclusa esperienza operativa per attività di campo.' },
      ],
      primaryCta: { href: '/contatti', label: 'Contatta EdilSync' },
      secondaryCta: { href: '/come-funziona', label: 'Vedi workflow' },
    },
    en: {
      eyebrow: 'FAQ',
      title: 'Fast answers to common pre-demo questions.',
      subtitle: 'For specific scenarios, we can run a demo mapped to your actual project flow.',
      challenges: [],
      modules: [],
      workflow: [],
      outcomes: [],
      faq: [
        { q: 'Is EdilSync suitable for small teams?', a: 'Yes. It is designed for fast-moving teams with tight operational constraints.' },
        { q: 'Does onboarding require heavy training?', a: 'No. Guided onboarding focuses on critical flows first.' },
        { q: 'Can we invite owners and subcontractors?', a: 'Yes, with contextual access and controlled visibility.' },
        { q: 'Can teams use it on smartphones?', a: 'Yes, including field-oriented operational views.' },
      ],
      primaryCta: { href: '/en/contatti', label: 'Contact EdilSync' },
      secondaryCta: { href: '/en/come-funziona', label: 'View workflow' },
    },
  },
  contatti: {
    it: {
      eyebrow: 'Contatti',
      title: 'Parliamo del tuo prossimo cantiere.',
      subtitle: 'Condividi il contesto attuale: prepariamo una demo orientata a rischio dispute, coordinamento e controllo operativo.',
      challenges: ['Cantieri gestiti su strumenti frammentati.', 'Scarsa visibilità tra attori principali.', 'Mancanza di storico utile in caso di conflitto.'],
      modules: [
        { title: 'Demo role-based', text: 'Mostriamo il flusso specifico per impresa, committente, tecnici e subappalto.' },
        { title: 'Mappa criticità', text: 'Identifichiamo i punti dove oggi perdi tempo, margine o controllo.' },
      ],
      workflow: ['Contatto', 'Call di allineamento', 'Demo personalizzata', 'Piano next-step'],
      outcomes: ['Visione chiara del fit operativo.', 'Percorso di adozione realistico.', 'Decisione più rapida e informata.'],
      faq: [{ q: 'In quanto tempo ricevo risposta?', a: 'Tipicamente entro 2 giorni lavorativi.' }],
      primaryCta: { href: '/contatti', label: 'Vai al form demo' },
      secondaryCta: { href: '/contractors', label: 'Prima vedi Per imprese' },
    },
    en: {
      eyebrow: 'Contact',
      title: 'Let us map your next project workflow.',
      subtitle: 'Share your current operating model and we will tailor a demo around dispute prevention and execution control.',
      challenges: ['Project communication spread across disconnected tools.', 'Low transparency between core actors.', 'No reliable evidence trail when conflict appears.'],
      modules: [
        { title: 'Role-based demo', text: 'See dedicated flows for contractors, owners, technical roles, and subs.' },
        { title: 'Friction mapping', text: 'Identify where margin, time, and trust are currently leaking.' },
      ],
      workflow: ['Contact', 'Alignment call', 'Custom demo', 'Next-step plan'],
      outcomes: ['Clear operational fit assessment.', 'Realistic adoption path.', 'Faster and safer decision-making.'],
      faq: [{ q: 'How quickly will we hear back?', a: 'Usually within 2 business days.' }],
      primaryCta: { href: '/en/contatti', label: 'Open demo form' },
      secondaryCta: { href: '/en/contractors', label: 'Explore contractor page first' },
    },
  },
};

const visualByPage = {
  funzionalita: '/images/public-hero-board.svg',
  'per-imprese': '/images/public-dispute-map.svg',
  'per-committenti': '/images/public-hero-board.svg',
  'per-subappaltatori': '/images/public-workflow.svg',
  'per-tecnici': '/images/public-dispute-map.svg',
  'come-funziona': '/images/public-workflow.svg',
  prezzi: '/images/public-hero-board.svg',
  faq: '/images/public-workflow.svg',
  contatti: '/images/public-dispute-map.svg',
};

export default function StaticMarketingPage({ pageKey, locale = 'it' }) {
  const rootRef = useRef(null);
  const page = pageMap[pageKey]?.[locale] || pageMap[pageKey]?.it;
  const basePath = locale === 'en' ? '/en' : '';
  const canonicalPath = `${basePath}/${pageKey}`;
  usePublicGsap(rootRef);

  if (!page) {
    return null;
  }

  usePublicSeo({
    title: page.title,
    description: page.subtitle,
    canonicalPath,
    locale,
    alternateItPath: `/${pageKey}`,
    alternateEnPath: `/en/${pageKey}`,
  });

  const faqData =
    page.faq?.length
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: page.faq.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: {
              '@type': 'Answer',
              text: item.a,
            },
          })),
        }
      : null;

  return (
    <>
      {faqData ? <StructuredData id={`faq-jsonld-${locale}`} data={faqData} /> : null}
      <div ref={rootRef} className={PUBLIC_CLASSES.page}>
        <section className="public-section-shell relative overflow-hidden px-6 pb-16 pt-28 md:pb-20 md:pt-36">
          <div className="pointer-events-none absolute left-[8%] top-20 h-64 w-64 rounded-full bg-[rgba(239,97,68,0.1)] blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute right-[10%] top-24 h-56 w-56 rounded-full bg-[rgba(196,158,108,0.1)] blur-3xl" aria-hidden />
          <div className="max-w-7xl mx-auto grid gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(300px,0.98fr)] items-center">
            <div>
              <div data-reveal className="public-eyebrow">
                {page.eyebrow}
              </div>
              <h1 data-reveal className={`${PUBLIC_CLASSES.displayH1} mt-6 max-w-[13ch] text-[var(--public-ink)]`}>{page.title}</h1>
              <p data-reveal className={`mt-5 max-w-[60ch] ${PUBLIC_CLASSES.bodyLead}`}>{page.subtitle}</p>
              <div data-reveal className="mt-8 flex flex-wrap gap-3">
                <Button asChild className={`${PUBLIC_CLASSES.primaryCta} h-11 px-6 text-[13px]`}>
                  <Link to={page.primaryCta.href}>{page.primaryCta.label}</Link>
                </Button>
                <Button asChild variant="ghost" className="public-outline-button rounded-full h-11 px-5 text-[13px] font-medium text-[var(--public-ink)]">
                  <Link to={page.secondaryCta.href}>{page.secondaryCta.label}</Link>
                </Button>
              </div>
            </div>
            <div data-reveal>
              <div className="public-device-frame">
                <img src={visualByPage[pageKey] || '/images/public-hero-board.svg'} alt="Visual EdilSync" className="w-full object-cover border border-white/10" />
                <div className="mt-4 public-grid-card p-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">
                    {locale === 'en' ? 'Operational context' : 'Contesto operativo'}
                  </p>
                  <p className="mt-2 text-sm leading-[1.65] text-[var(--public-muted)]">
                    {locale === 'en'
                      ? 'Designed to explain field coordination clearly, not to simulate a generic SaaS brochure.'
                      : 'Pensato per spiegare il coordinamento di cantiere con chiarezza, non per sembrare una brochure SaaS generica.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {page.challenges?.length ? (
          <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
            <p data-reveal className="public-eyebrow">{locale === 'en' ? 'Challenges' : 'Criticita principali'}</p>
            <h2 data-reveal className={`mt-5 max-w-[12ch] ${PUBLIC_CLASSES.displayH2}`}>
              {locale === 'en' ? 'Critical challenges to solve first' : 'Criticita da risolvere prima'}
            </h2>
            <ul className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {page.challenges.map((item) => (
                <li data-reveal key={item} className="public-grid-card p-6 text-[var(--public-muted)] leading-[1.7]">{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        {page.modules?.length ? (
          <section className="bg-[rgba(243,236,229,0.76)]">
            <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
              <p data-reveal className="public-eyebrow">{locale === 'en' ? 'Capabilities' : 'Capacita operative'}</p>
              <h2 data-reveal className={`mt-5 max-w-[11ch] ${PUBLIC_CLASSES.displayH2}`}>
                {locale === 'en' ? 'How EdilSync responds' : 'Come risponde EdilSync'}
              </h2>
              <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-12">
                {page.modules.map((item, index) => (
                  <article data-reveal key={item.title} className={`public-grid-card p-6 ${index % 3 === 0 ? 'xl:col-span-5' : index % 3 === 1 ? 'xl:col-span-3' : 'xl:col-span-4'}`}>
                    <h3 className="text-[22px] font-[700] leading-[1.25] tracking-[-0.03em] text-[var(--public-ink)]">{item.title}</h3>
                    <p className="mt-3 text-[14px] leading-[1.72] text-[var(--public-muted)]">{item.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {page.workflow?.length ? (
          <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
            <p data-reveal className="public-eyebrow">{locale === 'en' ? 'Workflow' : 'Flusso operativo'}</p>
            <h2 data-reveal className={`mt-5 max-w-[11ch] ${PUBLIC_CLASSES.displayH2}`}>
              {locale === 'en' ? 'Execution flow' : 'Flusso operativo'}
            </h2>
            <ol className="mt-10 grid gap-4 md:grid-cols-2">
              {page.workflow.map((item, index) => (
                <li data-reveal key={item} className="public-grid-card flex gap-3 p-5 text-[var(--public-muted)] leading-[1.68]">
                  <span className="mt-0.5 inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-[rgba(239,97,68,0.18)] bg-[rgba(255,243,239,0.92)] text-xs font-semibold text-[var(--public-accent)]">
                    {index + 1}
                  </span>
                  <p>{item}</p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {page.outcomes?.length ? (
          <section className="border-y border-[#111827] bg-[#15171c] text-white">
            <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
              <h2 data-reveal className={`${PUBLIC_CLASSES.darkDisplayH2} max-w-[11ch]`}>{locale === 'en' ? 'Expected outcomes' : 'Risultati attesi'}</h2>
              <ul className="mt-10 grid gap-4 md:grid-cols-2">
                {page.outcomes.map((item) => (
                  <li data-reveal key={item} className="public-kpi-card rounded-[24px] p-5 inline-flex items-start gap-3 text-[#d3dbe6]"><span className="mt-2 h-2 w-2 rounded-full bg-[#ef6144]" />{item}</li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {page.faq?.length ? (
          <section className="max-w-7xl mx-auto px-6 py-16 md:py-24">
            <p data-reveal className="public-eyebrow">FAQ</p>
            <h2 data-reveal className={`mt-5 ${PUBLIC_CLASSES.displayH2}`}>FAQ</h2>
            <div className="mt-6 space-y-3">
              {page.faq.map((item) => (
                <details data-reveal key={item.q} className="public-grid-card p-5">
                  <summary className="cursor-pointer font-semibold text-[#0f172a]">{item.q}</summary>
                  <p className="mt-3 text-[var(--public-muted)] leading-[1.7]">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <section className="border-y border-[#e8edf3] bg-[#15171c] text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,97,68,0.2),transparent_52%)]" aria-hidden />
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
            <h2 data-reveal className="text-[38px] sm:text-[52px] font-[780] leading-[1.08] max-w-4xl mx-auto tracking-[-0.018em]">
              {locale === 'en' ? 'Ready to evaluate EdilSync on your real workflow?' : 'Vuoi valutare EdilSync sul tuo flusso reale?'}
            </h2>
            <p data-reveal className="mt-5 text-[16px] sm:text-[18px] leading-[1.72] text-[#d8e1eb] max-w-3xl mx-auto">
              {locale === 'en'
                ? 'Book a focused demo to see how EdilSync can reduce disputes and increase operational clarity for your team.'
                : 'Prenota una demo focalizzata per vedere come EdilSync può ridurre dispute e aumentare la chiarezza operativa.'}
            </p>
            <div data-reveal className="mt-8 flex flex-wrap gap-3 justify-center">
              <Button asChild className="bg-[#ef6144] hover:bg-[#d9553a] text-white rounded-full h-10 px-6 text-[13px] font-semibold shadow-[0_10px_28px_rgba(239,97,68,0.28)]">
                <Link to={page.primaryCta.href}>{page.primaryCta.label}</Link>
              </Button>
              <Button asChild variant="outline" className="border-[#334155] text-white bg-transparent rounded-full h-10 px-5 text-[13px] font-medium hover:bg-[#1e293b]">
                <Link to={page.secondaryCta.href}>{page.secondaryCta.label}</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
