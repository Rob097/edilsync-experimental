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
      'Gestire 3-5 cantieri contemporaneamente è una sfida di coordinamento. EdilSync ti dà il contesto giusto per ogni progetto senza confusione.',
    note: 'Accesso gratuito nei progetti in cui vieni invitato',
    ctaTop: 'Apri account gratis',
    quote:
      'Arrivo in cantiere e il lavoro precedente non è finito. Un altro viaggio a vuoto. 150 euro di costo, zero fatturato. E nessuno mi aveva avvisato.',
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
        text: 'Vedi esclusivamente i task e le attività rilevanti per il tuo lavoro. Nessuna informazione superflua, solo ciò che ti serve.',
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
        text: 'Entri nel progetto solo quando sei stato invitato, con accesso limitato a ciò che è rilevante per il tuo ambito di lavoro.',
        icon: Navigation,
      },
      {
        title: 'Accesso gratuito su invito',
        text: 'Come subappaltatore, entri gratis nei progetti a cui vieni invitato. Se il progetto è sponsorizzato, sblocchi anche gli strumenti avanzati disponibili in quel progetto.',
        icon: ArrowRight,
      },
    ],
    finalTitle: 'Pronto a portare ordine nel tuo cantiere?',
    finalText:
      'Smetti di perdere tempo tra chat, email e telefonate. Inizia oggi con EdilSync e vedi la differenza dal primo giorno.',
    finalCta: 'Apri account gratis',
    finalNote: 'Accesso solo ai progetti invitati · Nessuna carta per iniziare · Collaborazione immediata',
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
    note: 'Free access on projects where you are invited',
    ctaTop: 'Open free account',
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
        title: 'Free invited access',
        text: 'As a subcontractor, you join invited projects for free. If the project is sponsored, you also unlock the premium project capabilities available inside that project.',
        icon: ArrowRight,
      },
    ],
    finalTitle: 'Ready to bring order to your construction site?',
    finalText: 'Stop wasting time across chats, emails, and calls. Start today with EdilSync and feel the difference from day one.',
    finalCta: 'Open free account',
    finalNote: 'Only invited-project access · No card required to start · Fast collaboration',
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
      <section className="public-section-shell pt-32 pb-[4.5rem] md:pb-24">
        <div className="mx-auto grid max-w-6xl px-4 sm:px-6 gap-10 lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)] lg:items-center">
          <div className="relative overflow-hidden rounded-[32px] border border-[var(--public-line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,246,240,0.88))] p-8 shadow-[0_30px_80px_rgba(37,25,20,0.08)] md:p-10" data-reveal>
            <div className="absolute -left-12 top-8 h-36 w-36 rounded-full bg-[rgba(239,97,68,0.14)] blur-3xl" aria-hidden />
            <div className="relative">
              <span className="public-eyebrow">{copy.badge}</span>
              <h1 className={`mt-5 ${PUBLIC_CLASSES.displayH1}`}>
                {copy.titleA} <span className="text-[var(--public-accent)]">{copy.titleB}</span> {copy.titleC}
              </h1>
              <p className={`mt-6 max-w-2xl ${PUBLIC_CLASSES.bodyLead}`}>{copy.subtitle}</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <PublicPrimaryCta to="/app" label={copy.ctaTop} />
                <p className="rounded-full border border-[rgba(239,97,68,0.18)] bg-[rgba(255,240,232,0.82)] px-4 py-2 text-sm font-semibold text-[var(--public-accent-dark)]">
                  {copy.note}
                </p>
              </div>
            </div>
          </div>

          <div className="public-device-frame self-start p-5 md:p-6" data-reveal>
            <div className="rounded-[28px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,247,242,0.92))] p-7 shadow-[0_18px_50px_rgba(52,35,29,0.1)]">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">
                <span>{locale === 'en' ? 'Field story' : 'Storia dal campo'}</span>
                <span>EdilSync</span>
              </div>
              <Quote className="mt-8 h-8 w-8 text-[var(--public-accent)]/30" />
              <p className="mt-4 text-[1.04rem] font-medium leading-8 text-[var(--public-ink)]">"{copy.quote}"</p>
              <div className="mt-8 flex items-center gap-3 border-t border-[var(--public-line)] pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(239,97,68,0.1)] font-bold text-[var(--public-accent)]">M</div>
                <div>
                  <p className="text-sm font-semibold text-[var(--public-ink)]">{copy.quoteAuthor}</p>
                  <p className={PUBLIC_CLASSES.bodyXsMuted}>{copy.quoteRole}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-[5.5rem]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl" data-reveal>
            <span className="public-eyebrow">{locale === 'en' ? 'Subcontractor flow' : 'Flusso subappalto'}</span>
            <h2 className={`mt-5 ${PUBLIC_CLASSES.sectionH2}`}>{copy.benefitsTitle}</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12">
            {copy.benefits.map((item, index) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  data-reveal
                  className={`p-6 ${PUBLIC_CLASSES.card} ${PUBLIC_CLASSES.cardHover} ${index === 0 ? 'xl:col-span-5' : index === 1 ? 'xl:col-span-3' : index === 2 ? 'xl:col-span-4' : index === 3 ? 'xl:col-span-4' : index === 4 ? 'xl:col-span-5' : 'xl:col-span-3'}`}
                >
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
