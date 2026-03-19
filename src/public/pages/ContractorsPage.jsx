import React, { useMemo, useRef } from 'react';
import { Camera, FileText, Shield, Smartphone, Users, Wallet } from 'lucide-react';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import MarketingSplitHero from '@/public/components/marketing/MarketingSplitHero';
import MarketingBenefitsGrid from '@/public/components/marketing/MarketingBenefitsGrid';
import MarketingValueListSection from '@/public/components/marketing/MarketingValueListSection';
import MarketingFinalCtaSection from '@/public/components/marketing/MarketingFinalCtaSection';

const contentByLocale = {
  it: {
    seoTitle: 'Per i Contractor',
    seoDescription:
      'Pagina dedicata ai contractor: protezione margini, documentazione automatica, coordinamento subappalti e controllo finanziario.',
    badge: 'Per i Contractor',
    titleA: 'Proteggi i tuoi margini.',
    titleB: 'Ogni giorno.',
    subtitle:
      'Con margini del 3-5%, una sola disputa non documentata puo azzerare il profitto di un intero progetto. EdilSync ti protegge automaticamente mentre lavori.',
    ctaTop: 'Inizia Gratis',
    quote:
      'Non sono io in ritardo - sto aspettando che il cliente scelga le piastrelle da tre settimane. Ma quando lascia una recensione negativa, indovina di chi e la colpa?',
    quoteAuthor: 'Michele',
    quoteRole: 'Contractor, 18 anni di esperienza',
    advantagesTitle: 'I vantaggi concreti per la tua impresa',
    advantages: [
      {
        title: 'Proteggiti dalle dispute',
        text: "Ogni variante e documentata con change request firmata. Stop alle discussioni 'pensavo fosse incluso' che erodono i tuoi margini.",
        icon: Shield,
      },
      {
        title: 'Documentazione automatica',
        text: 'Le foto che scatti in cantiere diventano automaticamente parte del dossier di progetto. Time-stamped, organizzate, sempre trovabili.',
        icon: Camera,
      },
      {
        title: 'Coordinamento subappalti',
        text: 'Invita elettricisti, idraulici e specialisti. Ognuno vede i propri task e il calendario condiviso. Zero viaggi a vuoto.',
        icon: Users,
      },
      {
        title: 'Tracciabilita totale',
        text: 'Chi ha detto cosa, quando, in quale progetto. Ogni azione e registrata. Protezione legale integrata nel lavoro quotidiano.',
        icon: FileText,
      },
      {
        title: 'Controllo finanziario',
        text: 'Budget, costi, tariffe e progress statements in un posto solo. Dalle timbrature in cantiere al SAL finale, tutto collegato.',
        icon: Wallet,
      },
      {
        title: 'Mobile-first, davvero',
        text: 'La modalita operativa e pensata per chi lavora sul campo. Upload foto in 3 tap, clock-in/out rapido, task del giorno sempre visibili.',
        icon: Smartphone,
      },
    ],
    valueTitle: 'Quanto vale per te EdilSync?',
    valueItems: [
      'Una disputa evitata (~EUR300 di media) = 15 mesi di abbonamento',
      'Un viaggio a vuoto evitato al mese = abbonamento coperto',
      '2 ore risparmiate al mese in chiamate di status = abbonamento coperto',
      'Una recensione negativa evitata = valore incalcolabile',
    ],
    valueCostLabel: 'Il costo:',
    valueCost: 'EUR19/mese',
    finalTitle: 'Pronto a portare ordine nel tuo cantiere?',
    finalText:
      'Smetti di perdere tempo tra chat, email e telefonate. Inizia oggi con EdilSync e vedi la differenza dal primo giorno.',
    finalCta: 'Inizia Gratis per 30 Giorni',
    finalNote: 'Nessuna carta di credito · Setup in 2 minuti · Cancella quando vuoi',
  },
  en: {
    seoTitle: 'For Contractors',
    seoDescription:
      'Dedicated contractor page: margin protection, automatic documentation, subcontractor coordination, and financial control.',
    badge: 'For Contractors',
    titleA: 'Protect your margin.',
    titleB: 'Every day.',
    subtitle:
      'With 3-5% margins, one undocumented dispute can erase profit on an entire project. EdilSync protects your operations automatically while you work.',
    ctaTop: 'Start Free',
    quote:
      'I am not late - I am waiting for the client to choose the tiles for three weeks. But when they leave a bad review, guess who gets blamed?',
    quoteAuthor: 'Michele',
    quoteRole: 'Contractor, 18 years experience',
    advantagesTitle: 'Concrete benefits for your company',
    advantages: [
      {
        title: 'Dispute protection',
        text: 'Every variation is documented with signed change request flow. No more margin-killing arguments on unclear scope.',
        icon: Shield,
      },
      {
        title: 'Automatic documentation',
        text: 'Photos from site become part of the project dossier automatically. Time-stamped, organized, and always retrievable.',
        icon: Camera,
      },
      {
        title: 'Subcontractor coordination',
        text: 'Invite specialist trades. Each one sees assigned tasks and shared calendar context. Fewer wasted trips.',
        icon: Users,
      },
      {
        title: 'Full traceability',
        text: 'Who said what, when, and in which project. Every action is logged for legal and operational clarity.',
        icon: FileText,
      },
      {
        title: 'Financial control',
        text: 'Budget, costs, rates, and progress statements in one place. From attendance to final statement, everything stays linked.',
        icon: Wallet,
      },
      {
        title: 'Truly mobile-first',
        text: 'Operative mode is built for field teams. Fast photo upload, quick clock-in/out, and daily tasks always visible.',
        icon: Smartphone,
      },
    ],
    valueTitle: 'How much is EdilSync worth for you?',
    valueItems: [
      'One avoided dispute (~EUR300 average) = 15 months of subscription',
      'One avoided wasted trip per month = subscription paid',
      '2 hours saved per month in status calls = subscription paid',
      'One avoided negative review = priceless value',
    ],
    valueCostLabel: 'Cost:',
    valueCost: 'EUR19/month',
    finalTitle: 'Ready to bring order to your construction site?',
    finalText: 'Stop wasting time across chats, emails, and calls. Start today with EdilSync and feel the difference from day one.',
    finalCta: 'Start 30-Day Free Trial',
    finalNote: 'No credit card · 2-minute setup · Cancel anytime',
  },
};

export default function ContractorsPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => contentByLocale[locale] || contentByLocale.it, [locale]);
  const basePath = locale === 'en' ? '/en' : '';
  const canonicalPath = locale === 'en' ? '/en/contractors' : '/contractors';

  usePublicGsap(rootRef);

  usePublicSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath,
    locale,
    alternateItPath: '/contractors',
    alternateEnPath: '/en/contractors',
  });

  return (
    <div ref={rootRef} className={PUBLIC_CLASSES.page}>
      <MarketingSplitHero
        badge={copy.badge}
        title={copy.titleA}
        titleHighlight={copy.titleB}
        subtitle={copy.subtitle}
        ctaLabel={copy.ctaTop}
        ctaHref="/app"
        quote={copy.quote}
        quoteAuthor={copy.quoteAuthor}
        quoteRole={copy.quoteRole}
        quoteInitial="M"
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
        ctaHref="/app"
        note={copy.finalNote}
      />
    </div>
  );
}
