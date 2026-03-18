import React, { useMemo, useRef } from 'react';
import { BellRing, CheckCheck, Clock3, FileText, MessagesSquare, ShieldCheck } from 'lucide-react';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import MarketingSplitHero from '@/public/components/marketing/MarketingSplitHero';
import MarketingBenefitsGrid from '@/public/components/marketing/MarketingBenefitsGrid';
import MarketingValueListSection from '@/public/components/marketing/MarketingValueListSection';
import MarketingFinalCtaSection from '@/public/components/marketing/MarketingFinalCtaSection';

const contentByLocale = {
  it: {
    seoTitle: 'Per Committenti',
    seoDescription:
      'Pagina dedicata ai committenti: trasparenza sui lavori, approvazioni tracciate, meno stress operativo e piu controllo su costi e tempi.',
    badge: 'Per Committenti',
    titleA: 'Segui il cantiere',
    titleB: 'con chiarezza.',
    subtitle:
      'Niente piu inseguimenti su chat e telefonate. Con EdilSync hai avanzamento, decisioni e varianti in un unico flusso, sempre aggiornato.',
    note: 'Pensato per chi non vuole sorprese su tempi, costi e responsabilita.',
    ctaTop: 'Richiedi una Demo',
    quote:
      'Prima dovevo chiedere aggiornamenti ogni settimana. Ora apro il progetto e vedo cosa e stato fatto, cosa manca e quali decisioni servono da parte mia.',
    quoteAuthor: 'Laura',
    quoteRole: 'Committente privata',
    advantagesTitle: 'Cosa ottieni concretamente',
    advantages: [
      {
        title: 'Visibilita reale sullo stato lavori',
        text: 'Timeline chiara con attivita completate, in corso e bloccate. Capisci subito dove si trova il progetto.',
        icon: Clock3,
      },
      {
        title: 'Decisioni e approvazioni tracciate',
        text: 'Ogni variante viene formalizzata con impatto su costi e tempi. Fine delle ambiguita a fine cantiere.',
        icon: CheckCheck,
      },
      {
        title: 'Comunicazione ordinata',
        text: 'Messaggi contestuali al progetto, non dispersi tra chat personali, chiamate e allegati senza contesto.',
        icon: MessagesSquare,
      },
      {
        title: 'Documenti sempre accessibili',
        text: 'Foto, file e decisioni restano collegati alle attivita corrette, cosi puoi ritrovare tutto in pochi secondi.',
        icon: FileText,
      },
      {
        title: 'Notifiche utili, non rumore',
        text: 'Ricevi alert solo quando serve davvero il tuo intervento: approvazioni, blocchi o scelte operative.',
        icon: BellRing,
      },
      {
        title: 'Piu tutela e meno stress',
        text: 'Con uno storico verificabile riduci conflitti, incomprensioni e rischi di contestazioni fuori controllo.',
        icon: ShieldCheck,
      },
    ],
    valueTitle: 'Quanto valore ti porta EdilSync?',
    valueItems: [
      'Una sola variante chiarita prima dell esecuzione evita costi extra e discussioni finali',
      'Meno tempo perso a rincorrere aggiornamenti = piu serenita durante tutto il progetto',
      'Decisioni tracciate riducono il rischio di incomprensioni e rilavorazioni',
      'Documentazione ordinata protegge i rapporti tra committente, impresa e tecnici',
    ],
    valueCostLabel: 'Attivazione per il committente:',
    valueCost: 'inclusa nel progetto',
    finalTitle: 'Vuoi un cantiere piu trasparente e meno stressante?',
    finalText:
      'Richiedi una demo e scopri come seguire lavori, decisioni e varianti senza perdere il controllo del progetto.',
    finalCta: 'Prenota una Demo',
    finalNote: 'Nessuna complessita tecnica · Accesso guidato · Collaborazione immediata',
  },
  en: {
    seoTitle: 'For Homeowners',
    seoDescription:
      'Dedicated homeowners page: clear project visibility, traceable approvals, less operational stress, and stronger control over cost and schedule.',
    badge: 'For Homeowners',
    titleA: 'Follow your project',
    titleB: 'with clarity.',
    subtitle:
      'No more chasing updates across chats and calls. EdilSync gives you progress, decisions, and scope changes in one structured timeline.',
    note: 'Built for people who want fewer surprises on time, cost, and accountability.',
    ctaTop: 'Request a Demo',
    quote:
      'I used to ask for updates every week. Now I open the project and immediately see what is done, what is pending, and what needs my decision.',
    quoteAuthor: 'Laura',
    quoteRole: 'Private homeowner',
    advantagesTitle: 'What you get in practice',
    advantages: [
      {
        title: 'Real visibility into progress',
        text: 'Clear timeline of completed, in-progress, and blocked activities. You always understand project status.',
        icon: Clock3,
      },
      {
        title: 'Traceable approvals and decisions',
        text: 'Every scope change is formalized with schedule and cost impact. No end-of-project ambiguity.',
        icon: CheckCheck,
      },
      {
        title: 'Organized communication',
        text: 'Project-context messages instead of scattered personal chats, calls, and detached attachments.',
        icon: MessagesSquare,
      },
      {
        title: 'Always-accessible documentation',
        text: 'Photos, files, and decisions stay linked to the right activities so you can find everything fast.',
        icon: FileText,
      },
      {
        title: 'Useful alerts, not noise',
        text: 'Get notified only when your input is needed: approvals, blockers, and critical choices.',
        icon: BellRing,
      },
      {
        title: 'More protection, less stress',
        text: 'A defensible timeline lowers conflict risk and keeps owner, contractor, and technical roles aligned.',
        icon: ShieldCheck,
      },
    ],
    valueTitle: 'How much value can EdilSync create for you?',
    valueItems: [
      'One clarified scope change before execution can prevent expensive end-stage disputes',
      'Less time spent chasing status means more confidence throughout the project',
      'Traceable decisions reduce misunderstandings and rework',
      'Organized documentation protects collaboration among owner, contractor, and technical roles',
    ],
    valueCostLabel: 'Homeowner access:',
    valueCost: 'included in the project',
    finalTitle: 'Want a more transparent, less stressful project?',
    finalText: 'Request a demo and see how to track execution, approvals, and changes without losing control.',
    finalCta: 'Book a Demo',
    finalNote: 'No technical setup burden · Guided access · Fast collaboration',
  },
};

export default function HomeownersPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => contentByLocale[locale] || contentByLocale.it, [locale]);
  const basePath = locale === 'en' ? '/en' : '';
  const canonicalPath = locale === 'en' ? '/en/per-committenti' : '/per-committenti';

  usePublicGsap(rootRef);

  usePublicSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath,
    locale,
    alternateItPath: '/per-committenti',
    alternateEnPath: '/en/per-committenti',
  });

  return (
    <div ref={rootRef} className={PUBLIC_CLASSES.page}>
      <MarketingSplitHero
        badge={copy.badge}
        title={copy.titleA}
        titleHighlight={copy.titleB}
        subtitle={copy.subtitle}
        note={copy.note}
        ctaLabel={copy.ctaTop}
        ctaHref={`${basePath}/contatti`}
        quote={copy.quote}
        quoteAuthor={copy.quoteAuthor}
        quoteRole={copy.quoteRole}
        quoteInitial="L"
      />

      <MarketingBenefitsGrid title={copy.advantagesTitle} items={copy.advantages} />

      <MarketingValueListSection
        title={copy.valueTitle}
        items={copy.valueItems}
        costLabel={copy.valueCostLabel}
        costValue={copy.valueCost}
      />

      <MarketingFinalCtaSection
        title={copy.finalTitle}
        text={copy.finalText}
        ctaLabel={copy.finalCta}
        ctaHref={`${basePath}/contatti`}
        note={copy.finalNote}
      />
    </div>
  );
}
