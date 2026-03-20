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

const contentByLocale = {
  it: {
    seoTitle: 'Funzionalita EdilSync',
    seoDescription:
      'Tutte le funzionalita EdilSync per coordinare progetti, comunicazione, documentazione, operativita e protezione in cantiere.',
    badge: 'Funzionalita',
    title: "Tutto in un'unica piattaforma",
    subtitle:
      'Non moduli separati, ma un ecosistema interconnesso che copre ogni aspetto del coordinamento di cantiere - dalla prima foto fino al SAL finale.',
    sections: [
      {
        title: 'Gestione Progetti',
        icon: Layers,
        colorClass: 'bg-blue-500/10 text-blue-600',
        cards: [
          {
            title: 'Task e Milestone',
            icon: ListChecks,
            description:
              'Organizza il lavoro per fasi, stanze e milestone. Ogni task ha stato, scadenza, assegnatario e puo essere bloccato con responsabilita taggata. Vista board e lista disponibili.',
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
        cards: [
          {
            title: 'Chat Contestuale',
            icon: MessageCircle,
            description:
              'Messaggi di progetto e di societa con riferimenti strutturati a task, milestone, documenti e change request. I riferimenti sono badge cliccabili.',
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
            description:
              'Upload, anteprima, download, commenti, revisioni e categorizzazione. Metadati tecnici avanzati: disciplina, fase, stato documento, tag.',
          },
          {
            title: 'BIM e Viewer 3D',
            icon: Globe,
            description:
              'Supporto IFC, GLB e GLTF. Viewer in-app con camera orbitale, parsing IFC e fallback automatico a viewer esterno.',
          },
        ],
      },
      {
        title: 'Finanza e Operativita',
        icon: Wallet,
        colorClass: 'bg-emerald-500/10 text-emerald-600',
        cards: [
          {
            title: 'Controllo Economico',
            icon: Wallet,
            description:
              'Budget, costi, tariffe e progress statement. Permessi granulari e visibilita per ruolo su forecast, extra approvati e contestazioni.',
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
              'Formalizza conflitti su scope, costi, ritardi, qualita e pagamenti. Timeline eventi, prove allegate e note di risoluzione.',
          },
          {
            title: 'Permessi Contestuali',
            icon: LockKeyhole,
            description:
              'Livelli di permesso su applicazione, contesto attivo, ruolo societa e ruolo progetto. Tutto relazionale e tracciabile.',
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
        title: "Modalita d'Uso",
        icon: Smartphone,
        colorClass: 'bg-indigo-500/10 text-indigo-600',
        cards: [
          {
            title: 'Workspace normale',
            icon: Layers,
            description:
              'Superficie completa con dashboard, progetti, calendario, aziende, notifiche e impostazioni per gestione avanzata.',
          },
          {
            title: 'Modalita Operativa',
            icon: Smartphone,
            description:
              'Interfaccia mobile-first per il cantiere: clock-in/out rapido, task di oggi, upload foto e chat compatta.',
          },
          {
            title: 'Accesso contestuale per ruolo',
            icon: Zap,
            description:
              'La stessa piattaforma adatta visibilita e azioni in base a contesto attivo, ruolo societa e ruolo progetto, senza superfici duplicate.',
          },
        ],
      },
    ],
  },
  en: {
    seoTitle: 'EdilSync Features',
    seoDescription:
      'All EdilSync features for project coordination, communication, documentation, field operations, and dispute protection.',
    badge: 'Features',
    title: 'Everything in one platform',
    subtitle:
      'Not separate modules, but one connected ecosystem covering every layer of construction coordination from first photo to final progress statement.',
    sections: [
      {
        title: 'Project Management',
        icon: Layers,
        colorClass: 'bg-blue-500/10 text-blue-600',
        cards: [
          {
            title: 'Tasks and Milestones',
            icon: ListChecks,
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
        cards: [
          {
            title: 'Contextual Chat',
            icon: MessageCircle,
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
            description:
              'Upload, preview, download, comments, revisions, and categorization with advanced metadata for discipline, phase, and status.',
          },
          {
            title: 'BIM and 3D Viewer',
            icon: Globe,
            description:
              'Native support for IFC, GLB, and GLTF with in-app orbit controls, IFC parsing, and automatic fallback to external viewer when needed.',
          },
        ],
      },
      {
        title: 'Finance and Operations',
        icon: Wallet,
        colorClass: 'bg-emerald-500/10 text-emerald-600',
        cards: [
          {
            title: 'Financial Control',
            icon: Wallet,
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
      <MarketingCenteredHero badge={copy.badge} title={copy.title} subtitle={copy.subtitle} />

      <section className="pb-32 px-6">
        <div className={`${PUBLIC_CLASSES.sectionContainer} space-y-24`}>
          {copy.sections.map((section) => {
            const SectionIcon = section.icon || Layers;

            return (
              <div key={section.title}>
                <div data-reveal className="flex items-center gap-3 mb-10">
                  <div className={`w-10 h-10 rounded-xl ${section.colorClass} flex items-center justify-center`}>
                    <SectionIcon className="w-5 h-5" />
                  </div>
                  <h2 className={PUBLIC_CLASSES.sectionTitle}>{section.title}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {section.cards.map((card) => {
                    const CardIcon = card.icon || FileText;

                    return (
                      <article
                        key={card.title}
                        data-reveal
                        className={`p-6 ${PUBLIC_CLASSES.card} ${PUBLIC_CLASSES.cardHover}`}
                      >
                        <div className={`w-11 h-11 rounded-xl ${section.colorClass} flex items-center justify-center mb-4`}>
                          <CardIcon className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-lg text-[#141821]">{card.title}</h3>
                        <p className="mt-2 text-sm text-[#5b6470] leading-relaxed">{card.description}</p>
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
