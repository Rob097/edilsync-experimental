import React, { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CircleCheck, CircleHelp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';

const contentByLocale = {
  it: {
    seoTitle: 'Prezzi',
    seoDescription:
      'Un prezzo semplice e completo: EUR19/mese per il contractor principale, committenti e subappaltatori gratis.',
    badge: 'Prezzi',
    title: 'Un prezzo. Tutto incluso.',
    subtitle: 'Nessun costo per utente, nessun modulo a pagamento, nessuna sorpresa.',
    planName: 'EdilSync Pro',
    planDesc: 'Per imprese edili di ogni dimensione',
    trialBadge: '30 giorni gratis',
    price: 'EUR19',
    priceSuffix: '/mese',
    priceNote: 'IVA esclusa - Fatturazione mensile - Cancella quando vuoi',
    cta: 'Inizia la Prova Gratuita',
    noCard: 'Nessuna carta di credito richiesta',
    includedLabel: 'Tutto incluso',
    includedItems: [
      'Progetti illimitati',
      'Utenti della tua azienda illimitati',
      'Committenti e subappaltatori gratuiti',
      'Task, milestone e calendario condiviso',
      'Documentazione fotografica automatica',
      'Change request e gestione varianti',
      'Chat di progetto contestuale',
      'Gestione dispute e tracciabilita',
      'Controllo economico e budget',
      'Timbrature e presenze con GPS',
      'Viewer BIM (IFC, GLB, GLTF)',
      'Gestione documenti avanzata',
      'Notifiche in-app e via email',
      'Dashboard e analytics per ruolo',
      'Modalita operativa mobile-first',
      'Export dati (CSV, XML, JSON)',
    ],
    freeAccessTitle: 'Committenti e subappaltatori accedono gratis',
    freeAccessText:
      'Paga solo il contractor principale. Tutti gli altri attori del cantiere - committenti, subappaltatori, professionisti - ricevono accesso gratuito alla piattaforma.',
    roles: [
      { label: 'Contractor', value: 'EUR19/mese', note: 'Paga l abbonamento' },
      { label: 'Committente', value: 'Gratis', note: 'Accesso completo al progetto' },
      { label: 'Subappaltatore', value: 'Gratis', note: 'Accesso ai propri task' },
    ],
    worthTitle: 'EUR19/mese vale la pena se...',
    worthItems: [
      'Eviti anche solo una disputa all anno (vale in media EUR200-EUR2.000)',
      'Risparmi 2 ore al mese di chiamate di status update',
      'Elimini un viaggio a vuoto al mese dei tuoi subappaltatori',
      'Un committente soddisfatto ti porta anche un solo referral',
    ],
    faqTitle: 'Domande sui prezzi',
    faqs: [
      {
        q: 'I miei committenti devono pagare?',
        a: 'No. Committenti e subappaltatori accedono gratuitamente. Paga solo il contractor principale.',
      },
      {
        q: 'Posso cancellare quando voglio?',
        a: 'Si, senza penali ne costi nascosti. Cancelli dalle impostazioni in qualsiasi momento.',
      },
      {
        q: 'Cosa succede ai dati se cancello?',
        a: 'Puoi esportare tutti i tuoi dati prima di cancellare. I dati vengono eliminati entro 30 giorni dalla cancellazione.',
      },
      {
        q: 'C e un contratto a lungo termine?',
        a: 'No. EdilSync e mese per mese, puoi cancellare in qualsiasi momento.',
      },
      {
        q: 'Esiste un piano per agenzie o grandi imprese?',
        a: 'Stiamo lavorando su un piano Enterprise. Scrivici a ciao@edilsync.it per discutere le tue esigenze.',
      },
    ],
    faqFooterStart: 'Hai altre domande?',
    faqFooterFaq: 'Vai alla pagina FAQ completa',
    faqFooterAnd: 'o',
    faqFooterContact: 'contattaci',
  },
  en: {
    seoTitle: 'Pricing',
    seoDescription:
      'Simple all-inclusive pricing: EUR19/month for the main contractor, owners and subcontractors access for free.',
    badge: 'Pricing',
    title: 'One price. Everything included.',
    subtitle: 'No per-user fee, no paid add-ons, no surprises.',
    planName: 'EdilSync Pro',
    planDesc: 'For construction companies of any size',
    trialBadge: '30 days free',
    price: 'EUR19',
    priceSuffix: '/month',
    priceNote: 'VAT excluded - Monthly billing - Cancel anytime',
    cta: 'Start Free Trial',
    noCard: 'No credit card required',
    includedLabel: 'Everything included',
    includedItems: [
      'Unlimited projects',
      'Unlimited users in your company',
      'Owners and subcontractors free',
      'Tasks, milestones and shared calendar',
      'Automatic photo documentation',
      'Change requests and variation management',
      'Contextual project chat',
      'Dispute management and traceability',
      'Financial control and budget',
      'Time tracking and attendance with GPS',
      'BIM Viewer (IFC, GLB, GLTF)',
      'Advanced document management',
      'In-app and email notifications',
      'Role-based dashboard and analytics',
      'Mobile-first operative mode',
      'Data export (CSV, XML, JSON)',
    ],
    freeAccessTitle: 'Owners and subcontractors access for free',
    freeAccessText:
      'Only the main contractor pays. All other project actors - owners, subcontractors, professionals - get free access to the platform.',
    roles: [
      { label: 'Contractor', value: 'EUR19/month', note: 'Pays subscription' },
      { label: 'Owner', value: 'Free', note: 'Full project access' },
      { label: 'Subcontractor', value: 'Free', note: 'Access to assigned tasks' },
    ],
    worthTitle: 'EUR19/month is worth it if...',
    worthItems: [
      'You avoid even one dispute per year (average value EUR200-EUR2,000)',
      'You save 2 hours per month on status calls',
      'You remove one wasted trip per month for your subcontractors',
      'One satisfied owner brings you even one referral',
    ],
    faqTitle: 'Pricing questions',
    faqs: [
      {
        q: 'Do my owners need to pay?',
        a: 'No. Owners and subcontractors get free access. Only the main contractor pays.',
      },
      {
        q: 'Can I cancel anytime?',
        a: 'Yes, no penalties and no hidden costs. Cancel any time from settings.',
      },
      {
        q: 'What happens to data if I cancel?',
        a: 'You can export all your data before cancellation. Data is deleted within 30 days after cancellation.',
      },
      {
        q: 'Is there a long-term contract?',
        a: 'No. EdilSync is month-to-month and you can cancel any time.',
      },
      {
        q: 'Do you offer an enterprise plan?',
        a: 'We are preparing an Enterprise plan. Write to ciao@edilsync.it to discuss your needs.',
      },
    ],
    faqFooterStart: 'Need more details?',
    faqFooterFaq: 'Go to full FAQ page',
    faqFooterAnd: 'or',
    faqFooterContact: 'contact us',
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
    <div ref={rootRef} className="min-h-screen bg-[#fcfcfc] font-inter">
      <section className="pt-32 pb-16 text-center px-6">
        <div className="max-w-3xl mx-auto">
          <span className="inline-block px-4 py-1.5 rounded-full bg-[#fff0eb] text-[#ef6144] text-sm font-medium mb-4" data-reveal>
            {copy.badge}
          </span>
          <h1 className="font-bold text-4xl md:text-5xl text-[#141821] tracking-tight" data-reveal>
            {copy.title}
          </h1>
          <p className="mt-4 text-lg text-[#5b6470]" data-reveal>
            {copy.subtitle}
          </p>
        </div>
      </section>

      <section className="pb-20 px-6 bg-[#fcfcfc]">
        <div className="max-w-lg mx-auto">
          <div className="relative bg-white rounded-3xl border-2 border-[#ef6144] shadow-2xl shadow-[#ef6144]/10 overflow-hidden" data-reveal>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ef6144]/60 via-[#ef6144] to-[#ef6144]/60" />
            <div className="p-8 md:p-10">
              <div className="flex items-start justify-between mb-2 gap-3">
                <div>
                  <h2 className="font-bold text-2xl text-[#141821]">{copy.planName}</h2>
                  <p className="text-[#6b7280] text-sm mt-1">{copy.planDesc}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-[#ef6144]/10 text-[#ef6144] text-xs font-semibold whitespace-nowrap">
                  {copy.trialBadge}
                </span>
              </div>

              <div className="mt-6 flex items-end gap-2">
                <span className="font-bold text-6xl text-[#141821] leading-none">{copy.price}</span>
                <span className="text-[#6b7280] mb-2">{copy.priceSuffix}</span>
              </div>
              <p className="text-xs text-[#6b7280] mt-1">{copy.priceNote}</p>

              <Button asChild className="bg-[#ef6144] text-white hover:bg-[#d9553a] px-8 w-full mt-8 rounded-full h-12 gap-2 shadow-lg shadow-[rgba(239,97,68,0.25)] text-base font-semibold">
                <Link to="/app">
                  {copy.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <p className="text-center text-xs text-[#6b7280] mt-3">{copy.noCard}</p>

              <div className="mt-8 pt-8 border-t border-[#e5e7eb]">
                <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-4">{copy.includedLabel}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {copy.includedItems.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CircleCheck className="w-4 h-4 text-[#ef6144] mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-[#5b6470]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#f3f4f680] px-6">
        <div className="max-w-4xl mx-auto text-center" data-reveal>
          <div className="w-12 h-12 rounded-xl bg-[#ef6144]/10 flex items-center justify-center mx-auto mb-5">
            <Users className="w-6 h-6 text-[#ef6144]" />
          </div>
          <h2 className="font-bold text-2xl text-[#141821]">{copy.freeAccessTitle}</h2>
          <p className="mt-3 text-[#5b6470] max-w-xl mx-auto">{copy.freeAccessText}</p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {copy.roles.map((role) => (
              <div key={role.label} className="p-5 rounded-2xl bg-white border border-[#e5e7eb]">
                <p className="font-semibold text-[#141821]">{role.label}</p>
                <p className="font-bold text-xl text-[#ef6144] mt-1">{role.value}</p>
                <p className="text-xs text-[#6b7280] mt-1">{role.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-[#fcfcfc]">
        <div className="max-w-3xl mx-auto text-center" data-reveal>
          <h2 className="font-bold text-2xl text-[#141821] mb-8">{copy.worthTitle}</h2>
          <div className="space-y-3 text-left">
            {copy.worthItems.map((item) => (
              <div key={item} className="flex items-start gap-3 p-4 rounded-xl bg-white border border-[#e5e7eb]">
                <CircleCheck className="w-5 h-5 text-[#ef6144] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#5b6470]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#f3f4f680] px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10" data-reveal>
            <h2 className="font-bold text-2xl text-[#141821]">{copy.faqTitle}</h2>
          </div>

          <div className="rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden divide-y divide-[#e5e7eb]">
            {copy.faqs.map((faq) => (
              <div key={faq.q} className="px-6 py-5" data-reveal>
                <div className="flex items-start gap-3">
                  <CircleHelp className="w-4 h-4 text-[#ef6144] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-[#141821]">{faq.q}</p>
                    <p className="mt-1.5 text-sm text-[#5b6470]">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-[#6b7280]" data-reveal>
            {copy.faqFooterStart}{' '}
            <Link className="text-[#ef6144] hover:underline" to={`${basePath}/faq`}>
              {copy.faqFooterFaq}
            </Link>{' '}
            {copy.faqFooterAnd}{' '}
            <Link className="text-[#ef6144] hover:underline" to={`${basePath}/contatti`}>
              {copy.faqFooterContact}
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
