import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';

const contentByLocale = {
  it: {
    seoTitle: 'FAQ',
    seoDescription: 'Domande frequenti su EdilSync: piattaforma, prezzi, funzionalita, permessi, sicurezza e supporto.',
    badge: 'FAQ',
    title: 'Domande frequenti',
    subtitle: 'Trova risposta alle domande piu comuni su EdilSync.',
    groups: [
      {
        title: 'Generale',
        items: [
          {
            q: 'Cos\'e EdilSync?',
            a: 'EdilSync e una piattaforma SaaS per il coordinamento di cantieri edili e ristrutturazioni. Unisce committenti, imprese, subappaltatori e professionisti in un unico spazio condiviso, con ruoli e permessi contestuali adattati a ogni progetto.',
          },
          {
            q: 'EdilSync e adatto anche per piccole imprese?',
            a: 'Assolutamente si. EdilSync e progettato specificamente per imprese edili sotto EUR1M di fatturato annuo che gestiscono 8-12 ristrutturazioni residenziali. L interfaccia e semplice, mobile-first e non richiede formazione.',
          },
          {
            q: 'In che lingue e disponibile EdilSync?',
            a: 'EdilSync e disponibile in italiano e in inglese. La lingua e selezionabile dal menu utente in qualsiasi momento.',
          },
        ],
      },
      {
        title: 'Prezzi e Abbonamento',
        items: [
          {
            q: 'Quanto costa EdilSync?',
            a: 'EdilSync costa EUR19/mese con tariffa fissa. Non ci sono costi per utente aggiuntivo, ne costi per progetto. L impresa paga, committenti e subappaltatori accedono gratuitamente.',
          },
          {
            q: 'C\'e una prova gratuita?',
            a: 'Si. Puoi usare EdilSync gratuitamente per 30 giorni senza inserire la carta di credito. Alla fine della prova puoi scegliere se continuare o meno.',
          },
          {
            q: 'Posso cancellare quando voglio?',
            a: 'Si, puoi cancellare l abbonamento in qualsiasi momento direttamente dalle impostazioni. Non ci sono penali ne costi nascosti.',
          },
          {
            q: 'I miei committenti devono pagare?',
            a: 'No. Committenti e subappaltatori accedono alla piattaforma completamente gratis. Solo l impresa contractor paga l abbonamento.',
          },
        ],
      },
      {
        title: 'Funzionalita',
        items: [
          {
            q: 'Posso usare EdilSync sul cantiere con il telefono?',
            a: 'Si, EdilSync e mobile-first. C e una modalita operativa dedicata all uso sul campo, pensata per operai, capicantiere e chiunque lavori on-site. Upload foto, clock-in/out e aggiornamenti task in pochi tap.',
          },
          {
            q: 'Come funzionano i permessi? Tutti vedono tutto?',
            a: 'No. EdilSync ha un sistema di permessi contestuale a 4 livelli: ruolo applicativo, contesto attivo (personale o aziendale), ruolo nella societa e ruolo nel progetto. Ogni persona vede solo cio che e rilevante per il suo ruolo nel progetto specifico.',
          },
          {
            q: 'Posso gestire i subappalti a catena?',
            a: 'Si. EdilSync supporta nativamente subappalti multipli. Un contractor puo invitare subappaltatori, che a loro volta possono avere il proprio team. I permessi e l accesso sono controllati a ogni livello.',
          },
          {
            q: 'E possibile visualizzare file BIM o modelli 3D?',
            a: 'Si. EdilSync supporta IFC, GLB e GLTF. C e un viewer in-app per IFC con parsing diretto, e un viewer 3D basato su Three.js per GLB/GLTF con camera orbitale e fit automatico.',
          },
          {
            q: 'Come funzionano le dispute?',
            a: 'Il modulo dispute permette di formalizzare conflitti su scope, costi, ritardi, qualita o pagamenti. Ogni disputa ha una timeline eventi, puo avere prove allegate, commenti, note di risoluzione e notifiche agli stakeholder. Tutto e documentato e immutabile.',
          },
        ],
      },
      {
        title: 'Privacy e Sicurezza',
        items: [
          {
            q: 'I miei dati sono al sicuro?',
            a: 'Si. EdilSync utilizza infrastruttura cloud con Row Level Security (RLS) su ogni operazione dati. L accesso ai dati e costruito su insiemi utente sincronizzati automaticamente da membership e partecipazioni.',
          },
          {
            q: 'Chi puo vedere i miei progetti?',
            a: 'Solo le persone che hai invitato come partecipanti al progetto. Ogni utente vede solo i progetti in cui e partecipante attivo, e solo le sezioni adeguate al proprio ruolo nel progetto.',
          },
        ],
      },
    ],
    finalTitle: 'Pronto a portare ordine nel tuo cantiere?',
    finalText: 'Smetti di perdere tempo tra chat, email e telefonate. Inizia oggi con EdilSync e vedi la differenza dal primo giorno.',
    finalCta: 'Inizia Gratis per 30 Giorni',
    finalNote: 'Nessuna carta di credito - Setup in 2 minuti - Cancella quando vuoi',
  },
  en: {
    seoTitle: 'FAQ',
    seoDescription: 'Frequently asked questions about EdilSync: platform, pricing, capabilities, permissions, security, and support.',
    badge: 'FAQ',
    title: 'Frequently asked questions',
    subtitle: 'Find answers to the most common questions about EdilSync.',
    groups: [
      {
        title: 'General',
        items: [
          {
            q: 'What is EdilSync?',
            a: 'EdilSync is a SaaS platform for construction and renovation coordination. It connects owners, contractors, subcontractors, and professionals in one shared workspace with contextual permissions.',
          },
          {
            q: 'Is EdilSync suitable for small companies?',
            a: 'Yes. It is designed for teams of different sizes and can scale with your operations.',
          },
          {
            q: 'Which languages are supported?',
            a: 'Currently Italian and English, with localized public flows and interface.',
          },
        ],
      },
      {
        title: 'Pricing & Subscription',
        items: [
          { q: 'How much does EdilSync cost?', a: 'The standard plan is EUR19/month for the main contractor.' },
          { q: 'Is there a free trial?', a: 'Yes, a 30-day free trial with no credit card required.' },
          { q: 'Can I cancel anytime?', a: 'Yes, you can cancel anytime without long-term lock-in.' },
          { q: 'Do my owners need to pay?', a: 'No. Owners and subcontractors access for free; only the main contractor pays.' },
        ],
      },
      {
        title: 'Capabilities',
        items: [
          { q: 'Can I use EdilSync from the jobsite on phone?', a: 'Yes, the platform is mobile-first and designed for field operations.' },
          {
            q: 'How do permissions work? Can everyone see everything?',
            a: 'No. Permissions are contextual by role and project participation, so visibility remains relevant and controlled.',
          },
          { q: 'Can I manage multi-level subcontracting?', a: 'Yes, including traceable responsibilities and coordination across teams.' },
          { q: 'Can I view BIM files or 3D models?', a: 'Yes, BIM viewer support is available for IFC, GLB, and GLTF.' },
          { q: 'How does dispute management work?', a: 'You can open a formal case with timeline, evidence, comments, and status tracking.' },
        ],
      },
      {
        title: 'Privacy & Security',
        items: [
          { q: 'Are my data secure?', a: 'Yes, we apply secure access controls and platform safeguards for project data protection.' },
          { q: 'Who can view my projects?', a: 'Only invited users with the correct contextual permissions.' },
        ],
      },
    ],
    finalTitle: 'Ready to bring order to your construction site?',
    finalText: 'Stop wasting time across chats, emails, and calls. Start with EdilSync today and feel the difference from day one.',
    finalCta: 'Start 30-Day Free Trial',
    finalNote: 'No credit card - 2-minute setup - Cancel anytime',
  },
};

export default function FaqPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => contentByLocale[locale] || contentByLocale.it, [locale]);
  const basePath = locale === 'en' ? '/en' : '';
  const canonicalPath = locale === 'en' ? '/en/faq' : '/faq';
  const [openItem, setOpenItem] = useState('0-0');

  usePublicGsap(rootRef);

  usePublicSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath,
    locale,
    alternateItPath: '/faq',
    alternateEnPath: '/en/faq',
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

      <section className="pb-24 px-6 bg-[#fcfcfc]">
        <div className="max-w-3xl mx-auto space-y-12">
          {copy.groups.map((group, gIndex) => (
            <div key={group.title} data-reveal>
              <h2 className="font-bold text-xl text-[#141821] mb-4 px-1">{group.title}</h2>
              <div className="rounded-2xl border border-[#e5e7eb] bg-white px-6">
                {group.items.map((item, iIndex) => {
                  const key = `${gIndex}-${iIndex}`;
                  const isOpen = openItem === key;
                  return (
                    <div key={item.q} className="border-b border-[#e5e7eb] last:border-0">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between py-5 text-left gap-4"
                        onClick={() => setOpenItem((prev) => (prev === key ? '' : key))}
                      >
                        <span className="font-semibold text-[#141821]">{item.q}</span>
                        <ChevronDown className={`w-5 h-5 text-[#6b7280] flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <div
                        className={`grid transition-all duration-300 ease-out ${
                          isOpen ? 'grid-rows-[1fr] opacity-100 pb-5' : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="text-[#5b6470] leading-relaxed text-sm">{item.a}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
