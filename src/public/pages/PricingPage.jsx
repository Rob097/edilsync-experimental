import React, { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CircleCheck, CircleHelp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PUBLIC_SIGNUP_PATH } from '@/lib/authRouting';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import MarketingFinalCtaSection from '@/public/components/marketing/MarketingFinalCtaSection';

const contentByLocale = {
  it: {
    seoTitle: 'Prezzi',
    seoDescription:
      'Prezzi chiari per società e cantieri: piano società free o paid, sponsorship cantiere e accesso gratuito per committente e collaboratori invitati.',
    badge: 'Prezzi',
    title: 'Prezzi chiari per società e cantieri.',
    subtitle: 'Gli strumenti avanzati dell’impresa appartengono alla società Pro. Quelli di cantiere si attivano con una sponsorship attiva.',
    planName: 'EdilSync Pro per società',
    planDesc: 'Per avere strumenti avanzati per l’impresa e sponsorizzare i cantieri',
    trialBadge: '€190/anno disponibile',
    price: '€19',
    priceSuffix: '/mese',
    priceNote: 'Oppure €190/anno - IVA esclusa - Cancella quando vuoi',
    legendTitle: 'Come funziona davvero il prezzo',
    legendItems: [
      {
        badge: 'Sempre free',
        title: 'Privati e invitati',
        text: 'Il committente resta free. Anche subappaltatori e professionisti partecipano gratis ai cantieri in cui vengono invitati.',
      },
      {
        badge: 'Società Pro',
        title: 'Chi paga',
        text: 'Paga solo la società che sceglie il piano Pro: ha strumenti avanzati per l’impresa, un’area operativa più completa e la possibilità di sponsorizzare i cantieri.',
      },
      {
        badge: 'Cantiere sponsorizzato',
        title: 'Cosa si sblocca',
        text: 'Milestone, economia, dispute, documenti avanzati e chat contestuale completa si attivano sul singolo cantiere sponsorizzato.',
      },
    ],
    cta: 'Crea account società',
    noCard: 'Nessuna carta richiesta per iniziare',
    includedLabel: 'Con EdilSync Pro hai',
    includedItems: [
      'Timbrature societarie',
      'Chat società multi-canale',
      'Documenti società completi',
      'Sponsorship del cantiere',
      'Milestone nei cantieri sponsorizzati',
      'Economia di cantiere nei cantieri sponsorizzati',
      'Chat cantiere avanzata nei cantieri sponsorizzati',
      'Documenti cantiere avanzati nei cantieri sponsorizzati',
      'Area operativa avanzata per l’impresa',
      'Fatturazione e gestione abbonamento',
    ],
    freeAccessTitle: 'Chi entra gratis e cosa resta free',
    freeAccessText:
      'Il privato resta gratis. Le società possono restare free o passare a Pro. Committente, subappaltatori e professionisti entrano gratis nei cantieri a cui sono invitati; gli strumenti avanzati di cantiere dipendono dalla sponsorship attiva.',
    roles: [
      { label: 'Privato / committente', value: 'Gratis', note: 'Puoi avere 1 cantiere non sponsorizzato alla volta' },
      { label: 'Società free', value: 'Gratis', note: 'Partecipa ai cantieri e può avere 1 cantiere owner non sponsorizzato alla volta' },
      { label: 'Società Pro', value: '€19/mese o €190/anno', note: 'Sponsorizza i cantieri e attiva gli strumenti avanzati dell’impresa' },
    ],
    worthTitle: 'Quando ha senso passare a Pro',
    worthItems: [
      'Vuoi sponsorizzare un cantiere e attivare milestone, economia, chat e documenti avanzati per tutti i partecipanti',
      'Ti servono timbrature e altri strumenti avanzati per l’impresa',
      'Gestisci più cantieri e vuoi evitare che il coordinamento resti bloccato nella modalità free',
      'Una sola disputa evitata o un solo viaggio a vuoto risparmiato copre facilmente il costo del piano',
    ],
    faqTitle: 'Domande sui prezzi',
    faqs: [
      {
        q: 'Il committente deve pagare?',
        a: 'No. Il committente resta free. Anche subappaltatori e professionisti possono entrare gratis nei cantieri a cui vengono invitati.',
      },
      {
        q: 'Posso cancellare quando voglio?',
        a: 'Sì, senza penali né costi nascosti. Cancelli dalle impostazioni in qualsiasi momento.',
      },
      {
        q: 'Cosa succede ai dati se cancello?',
        a: 'I dati restano nel sistema, ma le aree avanzate dell’impresa e del cantiere non sono più accessibili finché non riattivi un piano Pro o una sponsorship valida.',
      },
      {
        q: 'C’è un contratto a lungo termine?',
        a: 'No. EdilSync è mese per mese, puoi cancellare in qualsiasi momento.',
      },
      {
        q: 'Esiste un piano per agenzie o grandi imprese?',
        a: 'Stiamo lavorando su un piano Enterprise. Scrivici a info@rdlabs.digital per discutere le tue esigenze.',
      },
    ],
    faqFooterStart: 'Hai altre domande?',
    faqFooterFaq: 'Vai alla pagina FAQ completa',
    faqFooterAnd: 'o',
    faqFooterContact: 'contattaci',
    finalTitle: 'Vuoi capire se Pro ha senso per la tua impresa?',
    finalText: 'Parti free, guarda come lavora il team e passa a Pro quando vuoi attivare sponsorship, strumenti avanzati e controllo piu strutturato.',
    finalCta: 'Parla con noi',
    finalNote: 'Piano semplice · Nessun setup complesso · Upgrade quando serve',
  },
  en: {
    seoTitle: 'Pricing',
    seoDescription:
      'Clear pricing for companies and worksites: free or paid company plan, worksite sponsorship, and free access for homeowners and invited collaborators.',
    badge: 'Pricing',
    title: 'Clear pricing for companies and worksites.',
    subtitle: 'Company premium belongs to the company. Worksite premium unlocks through active sponsorship.',
    planName: 'EdilSync Pro for companies',
    planDesc: 'Unlock company premium and worksite sponsorship',
    trialBadge: 'Yearly plan at €190',
    price: '€19',
    priceSuffix: '/month',
    priceNote: 'Or €190/year - VAT excluded - Cancel anytime',
    legendTitle: 'How billing actually works',
    legendItems: [
      {
        badge: 'Always free',
        title: 'Owners and invitees',
        text: 'Homeowners stay free. Subcontractors and professionals also join invited worksites for free.',
      },
      {
        badge: 'Pro company',
        title: 'Who pays',
        text: 'Only the company that wants the Pro plan pays: it unlocks company premium, the premium operative workspace, and the ability to sponsor worksites.',
      },
      {
        badge: 'Sponsored worksite',
        title: 'What unlocks',
        text: 'Milestones, finance, disputes, advanced documents, and full worksite chat activate on each sponsored worksite.',
      },
    ],
    cta: 'Create company account',
    noCard: 'No card required to get started',
    includedLabel: 'EdilSync Pro unlocks',
    includedItems: [
      'Company time tracking',
      'Multi-channel company chat',
      'Full company documents',
      'Worksite sponsorship',
      'Milestones on sponsored worksites',
      'Worksite finance on sponsored worksites',
      'Advanced worksite chat on sponsored worksites',
      'Advanced worksite documents on sponsored worksites',
      'Premium company operative workspace',
      'Billing and subscription management',
    ],
    freeAccessTitle: 'Who stays free and what remains free',
    freeAccessText:
      'Private owners remain free. Companies can stay free or upgrade to Pro. Homeowners, subcontractors, and professionals can join invited worksites for free; premium worksite features depend on active sponsorship.',
    roles: [
      { label: 'Private owner / homeowner', value: 'Free', note: 'Can have 1 unsponsored worksite at a time' },
      { label: 'Free company', value: 'Free', note: 'Can join worksites and own 1 unsponsored worksite at a time' },
      { label: 'Paid company', value: '€19/month or €190/year', note: 'Can sponsor worksites and unlock company premium' },
    ],
    worthTitle: 'When Pro makes sense',
    worthItems: [
      'You want to sponsor a worksite and unlock milestones, finance, premium chat, and premium documents for all worksite participants',
      'You need company time tracking and other company premium capabilities',
      'You manage more than a minimal free setup and do not want coordination blocked by free-plan limits',
      'One avoided dispute or one avoided wasted trip can already justify the plan cost',
    ],
    faqTitle: 'Pricing questions',
    faqs: [
      {
        q: 'Does the homeowner need to pay?',
        a: 'No. Homeowners remain free. Subcontractors and professionals can also join invited worksites for free.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes, no penalties and no hidden costs. Cancel any time from settings.',
      },
      {
        q: 'What happens to data if I cancel?',
        a: 'Data stays in the system, but company and worksite premium areas become inaccessible until a paid plan or valid sponsorship is restored.',
      },
      {
        q: 'Is there a long-term contract?',
        a: 'No. EdilSync is month-to-month and you can cancel any time.',
      },
      {
        q: 'Do you offer an enterprise plan?',
        a: 'We are preparing an Enterprise plan. Write to info@rdlabs.digital to discuss your needs.',
      },
    ],
    faqFooterStart: 'Need more details?',
    faqFooterFaq: 'Go to full FAQ page',
    faqFooterAnd: 'or',
    faqFooterContact: 'contact us',
    finalTitle: 'Want to see whether Pro fits your company?',
    finalText: 'Start free, validate the workflow with your team, then upgrade when you need sponsorship, premium tools, and tighter control.',
    finalCta: 'Talk to us',
    finalNote: 'Simple plan · No heavy setup · Upgrade when needed',
  },
};

export default function PricingPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => contentByLocale[locale] || contentByLocale.it, [locale]);
  const basePath = locale === 'en' ? '/en' : '';
  const canonicalPath = locale === 'en' ? '/en/prezzi' : '/prezzi';

  usePublicGsap(rootRef);

  usePublicSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath,
    locale,
    alternateItPath: '/prezzi',
    alternateEnPath: '/en/prezzi',
  });

  return (
    <div ref={rootRef} className={PUBLIC_CLASSES.page}>
      <section className="public-section-shell pt-32 pb-14 md:pb-[4.5rem]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <span className="public-eyebrow" data-reveal>
            {copy.badge}
          </span>
          <h1 className={`mt-5 ${PUBLIC_CLASSES.displayH1}`} data-reveal>
            {copy.title}
          </h1>
          <p className={`mx-auto mt-5 max-w-2xl ${PUBLIC_CLASSES.bodyLead}`} data-reveal>
            {copy.subtitle}
          </p>
        </div>
      </section>

      <section className="public-section-shell pt-[4.5rem] pb-[4.5rem] md:pt-20 md:pb-20">
        <div className="mx-auto grid max-w-6xl px-4 sm:px-6 gap-8 xl:grid-cols-[minmax(0,0.92fr)_minmax(390px,0.78fr)] xl:items-start">
          <div className="space-y-4 xl:self-start" data-reveal>
            <article className="public-grid-card p-7 md:p-8">
              <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr] md:items-start">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">
                    {locale === 'en' ? 'Pricing structure' : 'Struttura del prezzo'}
                  </p>
                  <h2 className="mt-4 text-[clamp(1.55rem,2.4vw,2.3rem)] font-bold leading-[1.02] tracking-[-0.045em] text-[var(--public-ink)]">
                    {locale === 'en' ? 'Simple to explain on day one.' : 'Semplice da spiegare gia dal primo giorno.'}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-[var(--public-muted)]">
                    {locale === 'en'
                      ? 'EdilSync does not charge every person on the worksite. The company upgrades when it needs premium company tools and worksite sponsorship.'
                      : 'EdilSync non fa pagare ogni persona del cantiere. La società passa a Pro quando le servono strumenti avanzati per l’impresa e la sponsorship del cantiere.'}
                  </p>
                </div>
                <div className="space-y-3">
                  {copy.legendItems.map((item) => (
                    <article key={item.title} className="rounded-[22px] border border-[var(--public-line)] bg-[rgba(255,248,244,0.75)] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">{item.badge}</p>
                      <h3 className="mt-3 text-base font-semibold tracking-[-0.03em] text-[var(--public-ink)]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--public-muted)]">{item.text}</p>
                    </article>
                  ))}
                </div>
              </div>
            </article>
          </div>

          <div className="relative self-start overflow-hidden rounded-[32px] border border-[rgba(239,97,68,0.26)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,246,240,0.96))] shadow-[0_26px_70px_rgba(53,36,30,0.12)]" data-reveal>
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(239,97,68,0.35),rgba(239,97,68,1),rgba(239,97,68,0.35))]" />
            <div className="p-8 md:p-10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">{locale === 'en' ? 'Company plan' : 'Piano società'}</p>
                  <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[var(--public-ink)]">{copy.planName}</h2>
                  <p className="mt-2 text-sm text-[var(--public-muted)]">{copy.planDesc}</p>
                </div>
                <span className="rounded-full border border-[rgba(239,97,68,0.16)] bg-[rgba(255,240,232,0.88)] px-3 py-1 text-xs font-semibold text-[var(--public-accent-dark)]">
                  {copy.trialBadge}
                </span>
              </div>

              <div className="mt-8 flex items-end gap-2">
                <span className="text-6xl font-bold leading-none tracking-[-0.06em] text-[var(--public-ink)]">{copy.price}</span>
                <span className="mb-2 text-[var(--public-muted)]">{copy.priceSuffix}</span>
              </div>
              <p className="mt-2 text-xs text-[var(--public-muted)]">{copy.priceNote}</p>

              <Button asChild className="mt-8 h-12 w-full gap-2 rounded-full bg-[linear-gradient(135deg,#ef6144,#d9553a)] px-8 text-base font-semibold text-white shadow-[0_20px_44px_rgba(223,88,59,0.28)] hover:bg-[linear-gradient(135deg,#e55a3d,#c94d35)]">
                <Link to={PUBLIC_SIGNUP_PATH}>
                  {copy.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <p className="mt-3 text-center text-xs text-[var(--public-muted)]">{copy.noCard}</p>

              <div className="mt-8 border-t border-[var(--public-line)] pt-8">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--public-muted)]">{copy.includedLabel}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {copy.includedItems.slice(0, 6).map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CircleCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--public-accent)]" />
                      <span className="text-sm text-[var(--public-muted)]">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-[var(--public-muted)]">
                  {locale === 'en'
                    ? 'The rest of the advanced worksite capabilities unlock as soon as a Pro company sponsors the worksite.'
                    : 'Le altre aree avanzate di cantiere si attivano non appena una società Pro sponsorizza il cantiere.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-20">
        <div className="mx-auto grid max-w-6xl px-4 sm:px-6 gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] xl:items-start" data-reveal>
          <div>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(239,97,68,0.12)]">
              <Users className="h-6 w-6 text-[var(--public-accent)]" />
            </div>
            <h2 className={PUBLIC_CLASSES.sectionH2}>{copy.freeAccessTitle}</h2>
            <p className={`mt-4 max-w-xl ${PUBLIC_CLASSES.bodyBase}`}>{copy.freeAccessText}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {copy.roles.map((role, index) => (
              <div key={role.label} className="public-grid-card p-6">
                <p className="font-semibold text-[var(--public-ink)]">{role.label}</p>
                <p className="mt-2 text-xl font-bold text-[var(--public-accent)]">{role.value}</p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--public-muted)]">{role.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6" data-reveal>
          <div className="max-w-2xl">
            <span className="public-eyebrow">{locale === 'en' ? 'Upgrade logic' : 'Quando passare a Pro'}</span>
            <h2 className={`mt-5 ${PUBLIC_CLASSES.sectionH2}`}>{copy.worthTitle}</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-12">
            {copy.worthItems.map((item, index) => (
              <div key={item} className={`public-grid-card p-5 ${index === 0 ? 'md:col-span-2 xl:col-span-7' : index === 1 ? 'xl:col-span-5' : index === 2 ? 'xl:col-span-5' : 'xl:col-span-7'}`}>
                <div className="flex items-start gap-3">
                  <CircleCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--public-accent)]" />
                  <p className="text-sm leading-relaxed text-[var(--public-muted)]">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-10 text-center" data-reveal>
            <span className="public-eyebrow">{locale === 'en' ? 'Pricing FAQ' : 'Domande sui prezzi'}</span>
            <h2 className={`mt-5 ${PUBLIC_CLASSES.sectionH2}`}>{copy.faqTitle}</h2>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-[var(--public-line)] bg-[rgba(255,255,255,0.9)] divide-y divide-[var(--public-line)] shadow-[0_14px_42px_rgba(42,28,23,0.05)]">
            {copy.faqs.map((faq) => (
              <div key={faq.q} className="px-6 py-5 md:px-7" data-reveal>
                <div className="flex items-start gap-3">
                  <CircleHelp className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--public-accent)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--public-ink)]">{faq.q}</p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--public-muted)]">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-[var(--public-muted)]" data-reveal>
            {copy.faqFooterStart}{' '}
            <Link className="text-[var(--public-accent)] hover:underline" to={`${basePath}/faq`}>
              {copy.faqFooterFaq}
            </Link>{' '}
            {copy.faqFooterAnd}{' '}
            <Link className="text-[var(--public-accent)] hover:underline" to={`${basePath}/contatti`}>
              {copy.faqFooterContact}
            </Link>
            .
          </p>
        </div>
      </section>

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
