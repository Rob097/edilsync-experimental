import React, { useMemo, useRef } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Camera,
  ListChecks,
  MessageCircle,
  Navigation,
  Quote,
} from 'lucide-react';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import PublicPrimaryCta from '@/public/components/marketing/PublicPrimaryCta';
import MarketingFinalCtaSection from '@/public/components/marketing/MarketingFinalCtaSection';

const contentByLocale = {
  it: {
    seoTitle: 'Per i Subappaltatori',
    seoDescription:
      'Pagina dedicata ai subappaltatori: meno viaggi a vuoto, task contestuali, chat tracciata e accesso gratuito nei progetti EdilSync.',
    badge: 'Per i Subappaltatori',
    titleA: 'Sai esattamente',
    titleB: 'dove e quando',
    titleC: 'essere in cantiere.',
    subtitle:
      'Gestire 3-5 cantieri contemporaneamente e una sfida di coordinamento. EdilSync ti da il contesto giusto per ogni progetto senza confusione.',
    note: 'Accesso completamente gratuito per i subappaltatori',
    ctaTop: 'Inizia Gratis',
    quote:
      'Arrivo in cantiere e il lavoro precedente non e finito. Un altro viaggio a vuoto. €150 di costo, zero fatturato. E nessuno mi aveva avvisato.',
    quoteAuthor: 'Marco',
    quoteRole: 'Elettricista, 5 cantieri attivi',
    benefitsTitle: 'I vantaggi per chi lavora in subappalto',
    benefits: [
      {
        title: 'Zero viaggi a vuoto',
        text: 'Il calendario condiviso ti mostra quando sei atteso in cantiere. Se qualcosa cambia, ricevi notifica immediata. Fine ai viaggi inutili.',
        icon: CalendarDays,
      },
      {
        title: 'Solo i tuoi task',
        text: 'Vedi esclusivamente i task e le attivita rilevanti per il tuo lavoro. Nessuna informazione superflua, solo cio che ti serve.',
        icon: ListChecks,
      },
      {
        title: 'Chat senza numero personale',
        text: 'Comunica con il contractor e il team di progetto tramite la chat di EdilSync. Non devi dare il tuo numero di telefono personale.',
        icon: MessageCircle,
      },
      {
        title: 'Documenta il tuo lavoro',
        text: 'Foto e documenti associati ai tuoi task. Protezione documentale per il lavoro che esegui, accessibile quando serve.',
        icon: Camera,
      },
      {
        title: 'Accesso contestuale',
        text: 'Entri nel progetto solo quando sei stato invitato, con accesso limitato a cio che e rilevante per il tuo scope di lavoro.',
        icon: Navigation,
      },
      {
        title: 'Accesso gratuito',
        text: 'Come subappaltatore, accedi alla piattaforma completamente gratis. Paga solo il contractor principale.',
        icon: ArrowRight,
      },
    ],
    finalTitle: 'Pronto a portare ordine nel tuo cantiere?',
    finalText:
      'Smetti di perdere tempo tra chat, email e telefonate. Inizia oggi con EdilSync e vedi la differenza dal primo giorno.',
    finalCta: 'Inizia Gratis per 30 Giorni',
    finalNote: 'Nessuna carta di credito · Setup in 2 minuti · Cancella quando vuoi',
  },
  en: {
    seoTitle: 'For Subcontractors',
    seoDescription:
      'Dedicated page for subcontractors: fewer wasted trips, contextual tasks, traceable chat, and free project access in EdilSync.',
    badge: 'For Subcontractors',
    titleA: 'Know exactly',
    titleB: 'where and when',
    titleC: 'to be on site.',
    subtitle:
      'Managing 3-5 active jobs at once is a coordination challenge. EdilSync gives you the right context for each project without confusion.',
    note: 'Completely free access for subcontractors',
    ctaTop: 'Start Free',
    quote:
      'I arrive on site and the previous work is not finished. Another wasted trip. €150 cost, zero revenue. And nobody warned me.',
    quoteAuthor: 'Marco',
    quoteRole: 'Electrician, 5 active jobs',
    benefitsTitle: 'Benefits for subcontractors',
    benefits: [
      {
        title: 'No wasted trips',
        text: 'The shared calendar shows when you are expected on site. If plans change, you get immediate notification.',
        icon: CalendarDays,
      },
      {
        title: 'Only your tasks',
        text: 'See only the tasks and activities relevant to your scope. No noise, just what you need to execute.',
        icon: ListChecks,
      },
      {
        title: 'Chat without sharing personal number',
        text: 'Communicate with contractor and project team in EdilSync chat. No need to expose your personal phone number.',
        icon: MessageCircle,
      },
      {
        title: 'Document your work',
        text: 'Photos and documents tied to your tasks. Built-in protection for delivered work, accessible when needed.',
        icon: Camera,
      },
      {
        title: 'Contextual access',
        text: 'You enter projects only when invited, with visibility limited to what matters for your work package.',
        icon: Navigation,
      },
      {
        title: 'Free access',
        text: 'As a subcontractor, access is fully free. Only the primary contractor pays for the plan.',
        icon: ArrowRight,
      },
    ],
    finalTitle: 'Ready to bring order to your construction site?',
    finalText: 'Stop wasting time across chats, emails, and calls. Start today with EdilSync and feel the difference from day one.',
    finalCta: 'Start 30-Day Free Trial',
    finalNote: 'No credit card · 2-minute setup · Cancel anytime',
  },
};

export default function SubcontractorsPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => contentByLocale[locale] || contentByLocale.it, [locale]);
  const basePath = locale === 'en' ? '/en' : '';
  const canonicalPath = locale === 'en' ? '/en/per-subappaltatori' : '/per-subappaltatori';

  usePublicGsap(rootRef);

  usePublicSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath,
    locale,
    alternateItPath: '/per-subappaltatori',
    alternateEnPath: '/en/per-subappaltatori',
  });

  return (
    <div ref={rootRef} className={PUBLIC_CLASSES.page}>
      <section className="pt-32 pb-20 px-6 bg-[#fcfcfc]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div data-reveal>
            <span className={`${PUBLIC_CLASSES.badge} mb-4`}>{copy.badge}</span>
            <h1 className={`${PUBLIC_CLASSES.displayH1} text-[#141821]`}>
              {copy.titleA} <span className="text-[#ef6144]">{copy.titleB}</span> {copy.titleC}
            </h1>
            <p className={`mt-5 ${PUBLIC_CLASSES.bodyLead}`}>{copy.subtitle}</p>
            <p className="mt-3 text-sm text-[#ef6144] font-semibold">{`✓ ${copy.note}`}</p>
            <PublicPrimaryCta className="mt-6" to="/app" label={copy.ctaTop} />
          </div>

          <div data-reveal>
            <div className={`${PUBLIC_CLASSES.card} p-8`}>
              <Quote className="w-8 h-8 text-[#ef6144]/30 mb-4" />
              <p className="text-[#141821] font-medium leading-relaxed">"{copy.quote}"</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ef6144]/10 flex items-center justify-center font-bold text-[#ef6144]">M</div>
                <div>
                  <p className="font-semibold text-sm text-[#141821]">{copy.quoteAuthor}</p>
                  <p className={PUBLIC_CLASSES.bodyXsMuted}>{copy.quoteRole}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f3f4f680] px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className={`${PUBLIC_CLASSES.sectionH2} text-center mb-12`}>{copy.benefitsTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {copy.benefits.map((item) => {
              const Icon = item.icon;

              return (
                <article key={item.title} data-reveal className={`p-6 ${PUBLIC_CLASSES.card} ${PUBLIC_CLASSES.cardHover}`}>
                  <div className={`${PUBLIC_CLASSES.iconWrap} mb-4`}>
                    <Icon className={PUBLIC_CLASSES.icon} />
                  </div>
                  <h3 className={PUBLIC_CLASSES.sectionH3}>{item.title}</h3>
                  <p className={`mt-2 ${PUBLIC_CLASSES.bodySm}`}>{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

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
