import React, { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, CalendarDays, ListChecks, MessageCircle, Navigation, Quote, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';

const contentByLocale = {
  it: {
    seoTitle: 'Coordinamento Squadra',
    seoDescription:
      'Allinea contractor, committente, subappaltatori e professionisti in un unico flusso con task, calendario condiviso e comunicazione contestuale.',
    badge: 'Coordinamento del Team',
    title: 'Un cantiere ha 4-8 attori.',
    titleHighlight: 'Tutti devono essere allineati.',
    subtitle:
      'Contractor, committente, subappaltatori, architetti. Ognuno ha il suo calendario, le sue priorità, i suoi strumenti. EdilSync li allinea in un unico spazio condiviso.',
    cta: 'Apri EdilSync',
    stakeholdersTitle: 'Chi coordini con EdilSync',
    stakeholders: [
      {
        role: 'Contractor',
        roleClass: 'bg-blue-500/10 text-blue-600',
        text: 'Gestisce il progetto, assegna task, approva varianti, monitora costi.',
      },
      {
        role: 'Committente',
        roleClass: 'bg-amber-500/10 text-amber-600',
        text: 'Visibilità in tempo reale, approva change request, comunica con l’impresa.',
      },
      {
        role: 'Subappaltatore',
        roleClass: 'bg-emerald-500/10 text-emerald-600',
        text: 'Vede i propri task, il calendario condiviso, comunica con il contractor.',
      },
      {
        role: 'Professionista',
        roleClass: 'bg-purple-500/10 text-purple-600',
        text: 'Gestisce documenti tecnici, coordina con impresa e committente.',
      },
    ],
    problemsTitle: 'I problemi che il disallineamento causa ogni settimana',
    problems: [
      {
        title: 'Doppia prenotazione degli spazi',
        text: 'L’elettricista e il piastrellista devono lavorare nello stesso bagno lo stesso giorno. Nessuno lo sapeva.',
      },
      {
        title: 'Subappaltatore che arriva a vuoto',
        text: 'Il lavoro preparatorio non è finito. L’idraulico ha fatto 60 km per niente. Nessuno lo aveva avvisato.',
      },
      {
        title: 'Decisione bloccante non escalata',
        text: 'Il cliente deve scegliere le piastrelle. I lavori si fermano. Il contractor non sa di dover sollecitare.',
      },
      {
        title: 'Task assegnato alla persona sbagliata',
        text: 'Il task di impermeabilizzazione della terrazza finisce al muratore invece che allo specialista. Lo si scopre a lavori iniziati.',
      },
    ],
    alignmentTitle: 'Come EdilSync allinea tutti',
    alignment: [
      {
        title: 'Task assegnati con responsabilità chiare',
        text: 'Ogni task ha un assegnatario, una scadenza e uno stato. Chi deve fare cosa è scritto, senza ambiguità.',
        icon: ListChecks,
      },
      {
        title: 'Calendario unificato con conflict detection',
        text: 'Tutti gli impegni in un calendario condiviso che rileva automaticamente i conflitti.',
        icon: CalendarDays,
      },
      {
        title: 'Comunicazione contestuale',
        text: 'I messaggi sono agganciati ai task e ai documenti. Non più chat generiche dove le informazioni si perdono.',
        icon: MessageCircle,
      },
      {
        title: 'Notifiche attive per ogni stakeholder',
        text: 'Ogni persona riceve le notifiche rilevanti per il proprio ruolo. Nessuno può dire: non sapevo.',
        icon: Bell,
      },
      {
        title: 'Visibilità per ruolo',
        text: 'Ognuno vede solo ciò che è rilevante per il proprio ruolo nel progetto specifico.',
        icon: Navigation,
      },
      {
        title: 'Feed di progetto condiviso',
        text: 'Un unico feed cronologico con tutto ciò che succede nel cantiere. Tutti allineati.',
        icon: Zap,
      },
    ],
    citation:
      'La comunicazione frammentata costa al settore edile 31 miliardi di dollari all’anno. Non perché le persone non vogliano comunicare, ma perché non hanno gli strumenti giusti per farlo.',
    citationSource: 'FMI Corporation, Construction Industry Report',
    finalTitle: 'Pronto a portare ordine nel tuo cantiere?',
    finalText:
      'Smetti di perdere tempo tra chat, email e telefonate. Inizia oggi con EdilSync e vedi la differenza dal primo giorno.',
    finalCta: 'Apri EdilSync',
    finalNote: 'Account personale o società - Nessuna carta per iniziare - Upgrade quando serve',
  },
  en: {
    seoTitle: 'Team Coordination',
    seoDescription:
      'Align contractors, owners, subcontractors, and technical professionals in one workflow with shared tasks, calendar, and contextual communication.',
    badge: 'Team Coordination',
    title: 'A jobsite has 4-8 actors.',
    titleHighlight: 'Everyone must stay aligned.',
    subtitle:
      'Contractor, owner, subcontractors, architects. Each has different priorities, schedules, and tools. EdilSync aligns everyone in one shared workspace.',
    cta: 'Open EdilSync',
    stakeholdersTitle: 'Who you coordinate with EdilSync',
    stakeholders: [
      {
        role: 'Contractor',
        roleClass: 'bg-blue-500/10 text-blue-600',
        text: 'Manages project, assigns tasks, approves changes, monitors costs.',
      },
      {
        role: 'Owner',
        roleClass: 'bg-amber-500/10 text-amber-600',
        text: 'Real-time visibility, approves change requests, communicates with contractor.',
      },
      {
        role: 'Subcontractor',
        roleClass: 'bg-emerald-500/10 text-emerald-600',
        text: 'Sees own tasks, shared calendar, and contractor updates.',
      },
      {
        role: 'Professional',
        roleClass: 'bg-purple-500/10 text-purple-600',
        text: 'Handles technical docs and coordinates with contractor and owner.',
      },
    ],
    problemsTitle: 'Weekly issues caused by misalignment',
    problems: [
      {
        title: 'Double-booked work areas',
        text: 'Electrician and tiler are scheduled in the same bathroom on the same day. Nobody knew.',
      },
      {
        title: 'Subcontractor arrives with no prep complete',
        text: 'Preparatory work is not finished. The plumber drove 60km for nothing. Nobody warned them.',
      },
      {
        title: 'Blocking decision not escalated',
        text: 'Client must choose tiles. Work stops. Contractor does not know to escalate.',
      },
      {
        title: 'Task assigned to wrong person',
        text: 'Terrace waterproofing goes to the wrong trade. Issue appears after work starts.',
      },
    ],
    alignmentTitle: 'How EdilSync keeps everyone aligned',
    alignment: [
      {
        title: 'Assigned tasks with clear accountability',
        text: 'Each task has owner, deadline, and status. Responsibilities are explicit.',
        icon: ListChecks,
      },
      {
        title: 'Unified calendar with conflict detection',
        text: 'All visits, work slots, and deadlines in one shared schedule with automatic conflict checks.',
        icon: CalendarDays,
      },
      {
        title: 'Contextual communication',
        text: 'Messages are linked to tasks and documents so critical information is never lost.',
        icon: MessageCircle,
      },
      {
        title: 'Active notifications for every stakeholder',
        text: 'Each role receives only relevant updates. No one can claim they did not know.',
        icon: Bell,
      },
      {
        title: 'Role-based visibility',
        text: 'Everyone sees only what matters for their role in that project context.',
        icon: Navigation,
      },
      {
        title: 'Shared project feed',
        text: 'One chronological feed for what happens on site. Photos, updates, approvals: aligned by default.',
        icon: Zap,
      },
    ],
    citation:
      'Fragmented communication costs the construction industry $31B per year. Not because people do not want to communicate, but because they lack the right tools.',
    citationSource: 'FMI Corporation, Construction Industry Report',
    finalTitle: 'Ready to bring order to your construction site?',
    finalText: 'Stop wasting time across chats, emails, and calls. Start with EdilSync today and feel the difference from day one.',
    finalCta: 'Open EdilSync',
    finalNote: 'Personal or company account - No card required to start - Upgrade when needed',
  },
};

export default function TeamCoordinationPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => contentByLocale[locale] || contentByLocale.it, [locale]);
  const basePath = locale === 'en' ? '/en' : '';
  const canonicalPath = locale === 'en' ? '/en/team-coordination' : '/team-coordination';

  usePublicGsap(rootRef);

  usePublicSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath,
    locale,
    alternateItPath: '/team-coordination',
    alternateEnPath: '/en/team-coordination',
  });

  return (
    <div ref={rootRef} className={PUBLIC_CLASSES.page}>
      <section className="public-section-shell pt-32 pb-[4.5rem] md:pb-[5.5rem] text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <span className="public-eyebrow" data-reveal>
            {copy.badge}
          </span>
          <h1 className={`mt-5 ${PUBLIC_CLASSES.displayH1}`} data-reveal>
            {copy.title} <span className="text-[var(--public-accent)]">{copy.titleHighlight}</span>
          </h1>
          <p className={`mx-auto mt-5 max-w-2xl ${PUBLIC_CLASSES.bodyLead}`} data-reveal>
            {copy.subtitle}
          </p>
          <div className="mt-8" data-reveal>
            <Button asChild className="h-11 rounded-full bg-[linear-gradient(135deg,#ef6144,#d9553a)] px-8 text-white shadow-[0_20px_44px_rgba(223,88,59,0.28)] hover:bg-[linear-gradient(135deg,#e55a3d,#c94d35)]">
              <Link to="/app">
                {copy.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className={`mb-8 text-center ${PUBLIC_CLASSES.sectionH2}`} data-reveal>
            {copy.stakeholdersTitle}
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {copy.stakeholders.map((item) => (
              <div key={item.role} className="public-grid-card p-5 text-center" data-reveal>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${item.roleClass}`}>{item.role}</span>
                <p className="text-xs leading-relaxed text-[var(--public-muted)]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-[5.5rem]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center" data-reveal>
            <span className="public-eyebrow">{locale === 'en' ? 'Common failure points' : 'Punti di rottura'}</span>
            <h2 className={`mt-5 ${PUBLIC_CLASSES.sectionH2}`}>{copy.problemsTitle}</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {copy.problems.map((problem) => (
              <div key={problem.title} className="rounded-[24px] border border-[rgba(196,77,53,0.15)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,247,245,0.92))] p-6 shadow-[0_14px_34px_rgba(42,28,23,0.05)]" data-reveal>
                <h3 className="mb-2 text-lg font-semibold text-[var(--public-ink)]">{problem.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--public-muted)]">{problem.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-[5.5rem]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 text-center" data-reveal>
            <span className="public-eyebrow">{locale === 'en' ? 'Alignment engine' : 'Motore di allineamento'}</span>
            <h2 className={`mt-5 ${PUBLIC_CLASSES.sectionH2}`}>{copy.alignmentTitle}</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12">
            {copy.alignment.map((item, index) => (
              <div key={item.title} className={`p-6 ${PUBLIC_CLASSES.card} ${PUBLIC_CLASSES.cardHover} ${index === 0 ? 'xl:col-span-5' : index === 1 ? 'xl:col-span-3' : index === 2 ? 'xl:col-span-4' : index === 3 ? 'xl:col-span-4' : index === 4 ? 'xl:col-span-3' : 'xl:col-span-5'}`} data-reveal>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(239,97,68,0.12)]">
                  <item.icon className="h-5 w-5 text-[var(--public-accent)]" />
                </div>
                <h3 className={PUBLIC_CLASSES.sectionH3}>{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--public-muted)]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-20">
        <div className="public-grid-card mx-auto max-w-3xl px-4 sm:px-6 p-8 text-center" data-reveal>
          <Quote className="mx-auto mb-6 h-10 w-10 text-[var(--public-accent)]/20" />
          <p className="text-xl font-medium leading-relaxed text-[var(--public-ink)]">"{copy.citation}"</p>
          <p className="mt-4 text-sm text-[var(--public-muted)]">{copy.citationSource}</p>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-[#0b1220] relative overflow-hidden">
        <div data-parallax="slow" className="absolute top-0 left-1/3 w-96 h-96 bg-[#ef6144]/20 rounded-full blur-3xl pointer-events-none" />
        <div data-parallax="medium" className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#ef6144]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10" data-reveal>
          <h2 className={PUBLIC_CLASSES.darkDisplayH2}>{copy.finalTitle}</h2>
          <p className={`mt-6 ${PUBLIC_CLASSES.darkBodyLead}`}>{copy.finalText}</p>
          <div className="mt-10 flex justify-center">
            <Button asChild className="bg-[#ef6144] hover:bg-[#d9553a] text-white h-10 rounded-full px-10 text-base gap-2 shadow-lg shadow-[rgba(239,97,68,0.4)]">
              <Link to="/app">
                {copy.finalCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-white/40">{copy.finalNote}</p>
        </div>
      </section>
    </div>
  );
}
