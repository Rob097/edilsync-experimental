import React, { useMemo, useRef } from 'react';
import {
  Building2,
  CircleCheck,
  FolderOpen,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import MarketingCenteredHero from '@/public/components/marketing/MarketingCenteredHero';
import MarketingFinalCtaSection from '@/public/components/marketing/MarketingFinalCtaSection';
import MarketingStepTimeline from '@/public/components/marketing/MarketingStepTimeline';

const contentByLocale = {
  it: {
    seoTitle: 'Come funziona EdilSync',
    seoDescription:
      'Da zero a cantiere coordinato in pochi minuti: onboarding, progetto, inviti, operativita e controllo finale in un unico flusso.',
    badge: 'Come funziona',
    title: 'Da zero a cantiere coordinato in pochi minuti',
    subtitle: 'EdilSync e progettato per funzionare dal primo giorno, senza formazione e senza setup complessi.',
    ctaTop: 'Crea account gratis',
    steps: [
      {
        number: '01',
        title: 'Crea il tuo account',
        text: 'Registrati in 2 minuti. Nessuna carta per iniziare. Scegli se operare come privato o come societa.',
        note: 'Ogni persona ha un unico account e puo operare in piu contesti - come committente, come membro di una societa o come professionista. Un solo login per tutto.',
        icon: UserPlus,
      },
      {
        number: '02',
        title: 'Crea la tua societa',
        text: 'Registra la tua impresa su EdilSync. Aggiungi i tuoi collaboratori, assegna ruoli operativi e crea il canale di comunicazione interno.',
        note: "La societa e l'unita operativa del cantiere. Puoi avere project manager, capicantiere, operai, backoffice - ognuno con permessi adeguati al proprio ruolo.",
        icon: Building2,
      },
      {
        number: '03',
        title: 'Crea il progetto',
        text: 'Apri un nuovo cantiere su EdilSync. Aggiungi indirizzo, date, descrizione e la prima documentazione fotografica dello stato iniziale.',
        note: 'Il progetto e il contenitore di tutte le relazioni: committente, contractor, subappaltatori, professionisti, documenti, task, chat e finanza.',
        icon: FolderOpen,
      },
      {
        number: '04',
        title: 'Invita i partecipanti',
        text: 'Invita il committente, i subappaltatori e i professionisti via email. Ognuno vede solo cio che gli compete, con permessi adeguati al ruolo.',
        note: 'Il homeowner entra gratis. Subappaltatori e professionisti entrano gratis nei progetti a cui sono invitati. Le feature premium progettuali si sbloccano quando una societa paid sponsorizza il progetto.',
        icon: Users,
      },
      {
        number: '05',
        title: 'Lavora e documenta',
        text: 'Task, foto, messaggi, varianti, scadenze - ogni azione diventa automaticamente documentazione tracciabile nel feed del progetto.',
        note: "Non devi scrivere aggiornamenti. Le tue azioni quotidiane diventano il diario di cantiere. Il committente vede lo stesso feed in tempo reale.",
        icon: CircleCheck,
      },
      {
        number: '06',
        title: 'Controlla e chiudi',
        text: 'Monitora avanzamento, costi e milestone. Gestisci varianti approvate e dispute documentate. Chiudi il progetto con uno storico completo.',
        note: 'Dalla timbratura in cantiere al controllo costi, tutto resta collegato. Un SAL finale con tutta la documentazione in un unico posto.',
        icon: TrendingUp,
      },
    ],
    finalTitle: 'Pronto a portare ordine nel tuo cantiere?',
    finalText:
      'Smetti di perdere tempo tra chat, email e telefonate. Inizia oggi con EdilSync e vedi la differenza dal primo giorno.',
    finalCta: 'Crea account gratis',
    finalNote: 'Account personale o societa · Setup in 2 minuti · Upgrade quando serve',
  },
  en: {
    seoTitle: 'How EdilSync works',
    seoDescription:
      'From zero to a coordinated construction site in minutes: onboarding, project setup, participant invites, daily execution, and final control.',
    badge: 'How it works',
    title: 'From zero to a coordinated jobsite in minutes',
    subtitle: 'EdilSync is designed to work from day one, with no heavy training and no complex setup.',
    ctaTop: 'Create free account',
    steps: [
      {
        number: '01',
        title: 'Create your account',
        text: 'Sign up in 2 minutes. No card required to get started. Choose whether to operate as an individual or company.',
        note: 'Each person has one account and can operate in multiple contexts - as owner, company member, or professional. One login for everything.',
        icon: UserPlus,
      },
      {
        number: '02',
        title: 'Create your company',
        text: 'Register your contractor company in EdilSync. Add collaborators, assign operational roles, and activate your internal communication channel.',
        note: 'The company is the operational unit of the jobsite. You can have project managers, foremen, workers, and backoffice with contextual permissions.',
        icon: Building2,
      },
      {
        number: '03',
        title: 'Create the project',
        text: 'Open a new construction project in EdilSync. Add address, dates, description, and initial photo documentation.',
        note: 'The project is the container for all relationships: owner, contractor, subcontractors, professionals, docs, tasks, chat, and finance.',
        icon: FolderOpen,
      },
      {
        number: '04',
        title: 'Invite participants',
        text: 'Invite owners, subcontractors, and professionals by email. Each participant sees only relevant scope with role-based permissions.',
        note: 'The homeowner joins free. Subcontractors and professionals can join invited projects for free. Premium project capabilities unlock when a paid company sponsors the project.',
        icon: Users,
      },
      {
        number: '05',
        title: 'Work and document',
        text: 'Tasks, photos, messages, changes, deadlines - every action automatically becomes traceable project documentation.',
        note: 'You do not need to write manual updates. Daily actions become the jobsite journal, visible in real time.',
        icon: CircleCheck,
      },
      {
        number: '06',
        title: 'Control and close',
        text: 'Monitor progress, costs, and milestones. Manage approved changes and documented disputes. Close with complete project history.',
        note: 'From field attendance to cost control, everything remains connected. Final progress statement includes full evidence in one place.',
        icon: TrendingUp,
      },
    ],
    finalTitle: 'Ready to bring order to your construction site?',
    finalText: 'Stop wasting time across chats, emails, and calls. Start with EdilSync today and feel the difference from day one.',
    finalCta: 'Create free account',
    finalNote: 'Personal or company account · 2-minute setup · Upgrade when needed',
  },
};

export default function HowItWorksPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => contentByLocale[locale] || contentByLocale.it, [locale]);
  const basePath = locale === 'en' ? '/en' : '';
  const canonicalPath = locale === 'en' ? '/en/come-funziona' : '/come-funziona';

  usePublicGsap(rootRef);

  usePublicSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath,
    locale,
    alternateItPath: '/come-funziona',
    alternateEnPath: '/en/come-funziona',
  });

  return (
    <div ref={rootRef} className={PUBLIC_CLASSES.page}>
      <MarketingCenteredHero
        badge={copy.badge}
        title={copy.title}
        subtitle={copy.subtitle}
        ctaLabel={copy.ctaTop}
        ctaHref="/app"
      />

      <MarketingStepTimeline steps={copy.steps} />

      <MarketingFinalCtaSection
        title={copy.finalTitle}
        text={copy.finalText}
        ctaLabel={copy.finalCta}
        ctaHref="/app"
        note={copy.finalNote}
      />
    </div>
  );
}
