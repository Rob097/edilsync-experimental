import React, { useMemo, useRef } from 'react';
import {
  Bell,
  CalendarDays,
  Camera,
  ChartNoAxesColumn,
  Clock3,
  FileText,
  Globe,
  Layers,
  ListChecks,
  LockKeyhole,
  MessageCircle,
  Smartphone,
  Users,
  Wallet,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import MarketingCenteredHero from '@/public/components/marketing/MarketingCenteredHero';
import EntitlementHint from '@/public/components/marketing/EntitlementHint';

const contentByLocale = {
  it: {
    seoTitle: 'Funzionalità EdilSync',
    seoDescription:
      'Tutte le funzionalità EdilSync per coordinare progetti, comunicazione, documentazione, operatività e protezione in cantiere, distinguendo tra strumenti avanzati dell’impresa e strumenti avanzati del progetto sponsorizzato.',
    badge: 'Funzionalità',
    title: "Tutto in un'unica piattaforma",
    subtitle:
      'Non moduli separati, ma un ecosistema interconnesso che copre ogni aspetto del coordinamento di cantiere - dalla prima foto fino al SAL finale.',
    note:
      'Privati e collaboratori invitati restano free. Gli strumenti avanzati dell’impresa appartengono alla società Pro; milestone, controllo economico, documenti avanzati e chat progettuale completa si attivano nei progetti sponsorizzati.',
    sections: [
      {
        title: 'Gestione Progetti',
        icon: Layers,
        colorClass: 'bg-blue-500/10 text-blue-600',
        note: 'Le funzioni più avanzate di progetto qui descritte si attivano nei progetti sponsorizzati.',
        cards: [
          {
            title: 'Task e Milestone',
            icon: ListChecks,
            badge: 'Progetto sponsorizzato',
            description:
              'Organizza il lavoro per fasi, stanze e milestone. Ogni task ha stato, scadenza, assegnatario e può essere bloccato con responsabilità taggata. Vista board e lista disponibili.',
          },
          {
            title: 'Change Request / Varianti',
            icon: FileText,
            description:
              'Ogni modifica richiesta e tracciata con impatto su costi e tempi. Il committente approva, rifiuta o chiede chiarimenti. Tutto time-stamped.',
          },
          {
            title: 'Calendario Condiviso',
            icon: CalendarDays,
            description:
              'Calendario unificato per eventi, sopralluoghi e task con scadenza. Rileva conflitti automaticamente e notifica tutti gli interessati.',
          },
        ],
      },
      {
        title: 'Comunicazione',
        icon: MessageCircle,
        colorClass: 'bg-purple-500/10 text-purple-600',
        note: 'Chat e notifiche restano contestuali; i riferimenti avanzati di progetto si espandono nei progetti sponsorizzati.',
        cards: [
          {
            title: 'Chat Contestuale',
            icon: MessageCircle,
            badge: 'Progetto sponsorizzato',
            description:
              'Messaggi di progetto e di società con riferimenti strutturati a task, milestone, documenti e change request. I riferimenti sono badge cliccabili.',
          },
          {
            title: 'Notifiche Intelligenti',
            icon: Bell,
            description:
              'Notifiche in-app e via email per ogni evento rilevante: inviti, assegnazioni, aggiornamenti stato, mention. Configurabili per tipo e canale.',
          },
          {
            title: 'Inviti e Partecipazioni',
            icon: Users,
            description:
              'Invita committenti, subappaltatori e professionisti via email. Gestione stati (invitato, attivo, rifiutato) con permessi contestuali automatici.',
          },
        ],
      },
      {
        title: 'Documentazione',
        icon: Camera,
        colorClass: 'bg-amber-500/10 text-amber-600',
        note: 'La documentazione più strutturata e la collaborazione tecnica completa si esprimono nei progetti sponsorizzati.',
        cards: [
          {
            title: 'Documentazione Fotografica',
            icon: Camera,
            description:
              'Foto automaticamente associate al progetto, time-stamped, organizzabili per task e area. Protezione legale integrata senza lavoro extra.',
          },
          {
            title: 'Gestione Documenti Avanzata',
            icon: FileText,
            badge: 'Progetto sponsorizzato',
            description:
              'Upload, anteprima, download, commenti, revisioni e categorizzazione. Metadati tecnici avanzati: disciplina, fase, stato documento, tag.',
          },
          {
            title: 'BIM e Viewer 3D',
            icon: Globe,
            badge: 'Progetto sponsorizzato',
            description:
              'Nei progetti sponsorizzati, supporto IFC, GLB e GLTF con viewer in-app, camera orbitale, parsing IFC e fallback automatico a viewer esterno.',
          },
        ],
      },
      {
        title: 'Finanza e Operatività',
        icon: Wallet,
        colorClass: 'bg-emerald-500/10 text-emerald-600',
        note: 'Timbrature societarie appartengono alla società Pro; controllo economico e operatività di progetto dipendono dalla sponsorship attiva.',
        cards: [
          {
            title: 'Controllo Economico',
            icon: Wallet,
            badge: 'Progetto sponsorizzato',
            description:
              'Budget, costi, tariffe e progress statement. Permessi granulari e visibilità per ruolo su forecast, extra approvati e contestazioni.',
          },
          {
            title: 'Timbrature e Presenze',
            icon: Clock3,
            description:
              'Clock-in/out con GPS opzionale, note entrata/uscita e collegamento al progetto. Export dati e integrazione con il modulo costi.',
          },
          {
            title: 'Dashboard e Analytics',
            icon: ChartNoAxesColumn,
            description:
              'Dashboard contestuale per ruolo con indicatori su avanzamento, task completati, progetti attivi e membri presenti.',
          },
        ],
      },
      {
        title: 'Sicurezza e Protezione',
        icon: ShieldCheck,
        colorClass: 'bg-red-500/10 text-red-600',
        cards: [
          {
            title: 'Gestione Dispute',
            icon: ShieldCheck,
            description:
              'Formalizza conflitti su scope, costi, ritardi, qualità e pagamenti. Timeline eventi, prove allegate e note di risoluzione.',
          },
          {
            title: 'Permessi Contestuali',
            icon: LockKeyhole,
            description:
              'Livelli di permesso su applicazione, contesto attivo, ruolo società e ruolo progetto. Tutto relazionale e tracciabile.',
          },
          {
            title: 'Documentazione Automatica',
            icon: Zap,
            description:
              'Le azioni quotidiane diventano documentazione: il feed registra ogni cambio stato, upload, approvazione e messaggio.',
          },
        ],
      },
      {
        title: "Modalità d'Uso",
        icon: Smartphone,
        colorClass: 'bg-indigo-500/10 text-indigo-600',
        note: 'La modalità operativa rispetta gli stessi permessi e le stesse abilitazioni dell’area completa.',
        cards: [
          {
            title: 'Area completa',
            icon: Layers,
            description:
              'Area completa con dashboard, progetti, calendario, aziende, notifiche e impostazioni per la gestione quotidiana e amministrativa.',
          },
          {
            title: 'Modalità Operativa',
            icon: Smartphone,
            description:
              'Interfaccia mobile-first per il cantiere: clock-in/out rapido, task di oggi, upload foto e chat compatta.',
          },
          {
            title: 'Accesso contestuale per ruolo',
            icon: Zap,
            description:
              'La stessa piattaforma adatta visibilità e azioni in base al contesto attivo, al ruolo in impresa e al ruolo nel progetto, senza creare doppioni inutili.',
          },
        ],
      },
    ],
  },
  en: {
    seoTitle: 'EdilSync Features',
    seoDescription:
      'All EdilSync features for project coordination, communication, documentation, field operations, and dispute protection, with a clear split between company premium and sponsored-project premium.',
    badge: 'Features',
    title: 'Everything in one platform',
    subtitle:
      'Not separate modules, but one connected ecosystem covering every layer of construction coordination from first photo to final progress statement.',
    note:
      'Private owners and invited collaborators remain free. Company premium belongs to the Pro company; milestones, financial control, advanced documents, and full project chat unlock on sponsored projects.',
    sections: [
      {
        title: 'Project Management',
        icon: Layers,
        colorClass: 'bg-blue-500/10 text-blue-600',
        note: 'The premium project surfaces described here unlock on sponsored projects.',
        cards: [
          {
            title: 'Tasks and Milestones',
            icon: ListChecks,
            badge: 'Sponsored project',
            description:
              'Organize execution by phases, rooms, and milestones. Each task has status, due date, owner, and optional blocked accountability. Board and list views included.',
          },
          {
            title: 'Change Requests / Variations',
            icon: FileText,
            description:
              'Every requested change is tracked with cost and time impact. Owners can approve, reject, or ask for clarifications. Fully time-stamped.',
          },
          {
            title: 'Shared Calendar',
            icon: CalendarDays,
            description:
              'Unified calendar for events, site visits, and due tasks. Detects conflicts automatically and notifies all involved participants.',
          },
        ],
      },
      {
        title: 'Communication',
        icon: MessageCircle,
        colorClass: 'bg-purple-500/10 text-purple-600',
        note: 'Chat and notifications stay contextual; advanced project references expand on sponsored projects.',
        cards: [
          {
            title: 'Contextual Chat',
            icon: MessageCircle,
            badge: 'Sponsored project',
            description:
              'Project and company messages linked to tasks, milestones, documents, and change requests through structured clickable references.',
          },
          {
            title: 'Smart Notifications',
            icon: Bell,
            description:
              'In-app and email notifications for key events: invitations, assignments, status updates, and mentions. Configurable by type and channel.',
          },
          {
            title: 'Invites and Participation',
            icon: Users,
            description:
              'Invite owners, subcontractors, and professionals by email. Track invite status and apply contextual permissions automatically.',
          },
        ],
      },
      {
        title: 'Documentation',
        icon: Camera,
        colorClass: 'bg-amber-500/10 text-amber-600',
        note: 'Advanced document workflows and full technical collaboration are strongest on sponsored projects.',
        cards: [
          {
            title: 'Photo Documentation',
            icon: Camera,
            description:
              'Photos are automatically linked to the project, time-stamped, and organized by task and area with built-in legal protection.',
          },
          {
            title: 'Advanced Document Management',
            icon: FileText,
            badge: 'Sponsored project',
            description:
              'Upload, preview, download, comments, revisions, and categorization with advanced metadata for discipline, phase, and status.',
          },
          {
            title: 'BIM and 3D Viewer',
            icon: Globe,
            badge: 'Sponsored project',
            description:
              'On sponsored projects, native support for IFC, GLB, and GLTF with in-app orbit controls, IFC parsing, and automatic fallback to external viewer when needed.',
          },
        ],
      },
      {
        title: 'Finance and Operations',
        icon: Wallet,
        colorClass: 'bg-emerald-500/10 text-emerald-600',
        note: 'Company attendance belongs to the Pro company; project financial control and project operations depend on active sponsorship.',
        cards: [
          {
            title: 'Financial Control',
            icon: Wallet,
            badge: 'Sponsored project',
            description:
              'Budgets, costs, labor rates, and progress statements with role-based visibility on forecasts, approved extras, and contested items.',
          },
          {
            title: 'Attendance and Clock-in',
            icon: Clock3,
            description:
              'Clock-in/out with optional GPS, entry and exit notes, project linkage, data export, and integration with cost control.',
          },
          {
            title: 'Dashboards and Analytics',
            icon: ChartNoAxesColumn,
            description:
              'Role-aware dashboards showing progress indicators, completed tasks, active projects, and team presence across contexts.',
          },
        ],
      },
      {
        title: 'Security and Protection',
        icon: ShieldCheck,
        colorClass: 'bg-red-500/10 text-red-600',
        cards: [
          {
            title: 'Dispute Management',
            icon: ShieldCheck,
            description:
              'Formalize conflicts on scope, costs, delays, quality, and payments with event timelines, evidence, and resolution notes.',
          },
          {
            title: 'Contextual Permissions',
            icon: LockKeyhole,
            description:
              'Permission levels across app scope, active context, company role, and project role. Fully relational and traceable.',
          },
          {
            title: 'Automatic Documentation',
            icon: Zap,
            description:
              'Daily actions become documentation automatically: status changes, uploads, approvals, and messages are captured in the project feed.',
          },
        ],
      },
      {
        title: 'Usage Modes',
        icon: Smartphone,
        colorClass: 'bg-indigo-500/10 text-indigo-600',
        note: 'Operative mode follows the same permissions and entitlement logic as the full workspace.',
        cards: [
          {
            title: 'Normal workspace',
            icon: Layers,
            description:
              'Full workspace with dashboards, projects, calendar, companies, notifications, and settings for advanced management.',
          },
          {
            title: 'Operative Mode',
            icon: Smartphone,
            description:
              'Mobile-first interface for field teams with quick clock-in/out, daily tasks, photo uploads, and compact chat.',
          },
          {
            title: 'Contextual role access',
            icon: Zap,
            description:
              'The same platform adapts visibility and actions based on active context, company role, and project role without duplicating surfaces.',
          },
        ],
      },
    ],
  },
};

export default function FeaturesPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => contentByLocale[locale] || contentByLocale.it, [locale]);
  const canonicalPath = locale === 'en' ? '/en/funzionalita' : '/funzionalita';

  usePublicGsap(rootRef);

  usePublicSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath,
    locale,
    alternateItPath: '/funzionalita',
    alternateEnPath: '/en/funzionalita',
  });

  return (
    <div ref={rootRef} className={PUBLIC_CLASSES.page}>
      <MarketingCenteredHero badge={copy.badge} title={copy.title} subtitle={copy.subtitle} note={copy.note} />

      <section className="public-section-shell pt-[4.5rem] pb-24 md:pt-20 md:pb-32">
        <div className={`${PUBLIC_CLASSES.sectionContainer} space-y-20 md:space-y-24`}>
          {copy.sections.map((section) => {
            const SectionIcon = section.icon || Layers;

            return (
              <div key={section.title} className="grid gap-8 xl:grid-cols-[minmax(220px,0.32fr)_minmax(0,1fr)] xl:items-start">
                <div data-reveal className="xl:sticky xl:top-28">
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${section.colorClass}`}>
                    <SectionIcon className="h-5 w-5" />
                  </div>
                  <h2 className={PUBLIC_CLASSES.sectionTitle}>{section.title}</h2>
                  {section.note ? <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--public-muted)]">{section.note}</p> : null}
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {section.cards.map((card, index) => {
                    const CardIcon = card.icon || FileText;

                    return (
                      <article
                        key={card.title}
                        data-reveal
                        className={`relative p-6 ${PUBLIC_CLASSES.card} ${PUBLIC_CLASSES.cardHover} ${index === 0 ? 'md:col-span-2 xl:col-span-2' : ''}`}
                      >
                        <EntitlementHint label={card.badge} className="absolute right-4 top-4" />
                        <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl ${section.colorClass}`}>
                          <CardIcon className="h-5 w-5" />
                        </div>
                        <h3 className={PUBLIC_CLASSES.sectionH3}>{card.title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-[var(--public-muted)]">{card.description}</p>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
