import React, { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, CalendarDays, Camera, CircleCheck, Eye, MessageCircle, Quote, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';

const contentByLocale = {
  it: {
    seoTitle: 'Trasparenza Committente',
    seoDescription:
      'Segui il cantiere in tempo reale senza chiamare: feed progetto, notifiche utili, milestone chiare e trasparenza su costi e varianti.',
    badge: 'Trasparenza del Cantiere',
    title: 'Sai sempre cosa succede.',
    titleHighlight: 'Senza chiamare.',
    subtitle:
      'Stai investendo una somma importante nella tua casa o nel tuo immobile. Hai il diritto - e la possibilita - di avere visibilita completa su ogni fase del cantiere, in tempo reale.',
    note: 'Accesso completamente gratuito per i committenti',
    cta: 'Inizia Gratis',
    quote:
      '"Ho speso €65.000 per ristrutturare l appartamento. Per tre mesi ho chiamato il contractor ogni due giorni per sapere a che punto erano. Mi sentivo fastidioso, ma non avevo altra scelta."',
    quoteAuthor: 'Simona',
    quoteRole: 'Committente, Milano - prima di EdilSync',
    compareTitle: 'Prima e dopo EdilSync',
    compareRows: [
      ['Chiami il contractor per sapere a che punto e il lavoro', 'Apri l app e vedi il feed aggiornato'],
      ['Non sai se una variante aumentera il costo finale', 'Ogni modifica arriva con impatto su costi e tempi'],
      ['Il ritardo e colpa mia anche se stavi aspettando il materiale', 'La causa del ritardo e sempre documentata'],
      ['Non capisci il SAL che ti hanno mandato', 'Lo stato di avanzamento e visibile in tempo reale'],
      ['Fai un sopralluogo non annunciato perche non ti fidi', 'Hai visibilita piena senza dover disturbare nessuno'],
    ],
    featuresTitle: 'Tutto cio che vedi come committente',
    featuresSubtitle: 'Visibilita totale, senza interferire con il lavoro dell impresa.',
    features: [
      {
        title: 'Feed del progetto in tempo reale',
        text: 'Ogni azione - foto caricata, task completato, variante approvata - compare nel feed. Il committente vede lo stesso cantiere che vede il contractor, senza dover chiamare.',
        icon: Eye,
      },
      {
        title: 'Notifiche proattive',
        text: 'Quando succede qualcosa di rilevante, ricevi una notifica. Niente piu ansia da cosa stara succedendo in cantiere.',
        icon: Bell,
      },
      {
        title: 'Documentazione fotografica',
        text: 'Le foto scattate dal cantiere sono automaticamente visibili nel progetto. Vedi lo stato di ogni area, ogni giorno, senza sopralluoghi non programmati.',
        icon: Camera,
      },
      {
        title: 'Milestone e scadenze chiare',
        text: 'La timeline del progetto e condivisa. Sai quando aspettarti ogni fase completata e ricevi un avviso se qualcosa e in ritardo, con la causa documentata.',
        icon: CalendarDays,
      },
      {
        title: 'Trasparenza economica',
        text: 'Vedi il budget, i costi approvati e lo stato avanzamento lavori. Le varianti arrivano come change request formali con impatto su costi e tempistiche.',
        icon: Wallet,
      },
      {
        title: 'Canale diretto con l impresa',
        text: 'La chat di progetto mantiene tutta la comunicazione nel contesto giusto, collegata a task e documenti specifici. Fine alle email perse e ai messaggi senza risposta.',
        icon: MessageCircle,
      },
    ],
    finalTitle: 'Pronto a portare ordine nel tuo cantiere?',
    finalText:
      'Smetti di perdere tempo tra chat, email e telefonate. Inizia oggi con EdilSync e vedi la differenza dal primo giorno.',
    finalCta: 'Inizia Gratis per 30 Giorni',
    finalNote: 'Nessuna carta di credito - Setup in 2 minuti - Cancella quando vuoi',
  },
  en: {
    seoTitle: 'Client Transparency',
    seoDescription:
      'Follow your project in real time without constant calls: live feed, meaningful alerts, clear milestones, and visibility on costs and changes.',
    badge: 'Jobsite Transparency',
    title: 'Always know what is happening.',
    titleHighlight: 'Without calling.',
    subtitle:
      'You are investing serious money in your home or property. You should have full visibility on each project phase, in real time.',
    note: 'Completely free access for homeowners',
    cta: 'Start Free',
    quote:
      '"I spent €65,000 to renovate my apartment. For three months I called the contractor every two days just to understand progress. I felt annoying, but I had no alternative."',
    quoteAuthor: 'Simona',
    quoteRole: 'Homeowner, Milan - before EdilSync',
    compareTitle: 'Before and after EdilSync',
    compareRows: [
      ['You call the contractor to ask for updates', 'Open the app and see the updated feed'],
      ['You do not know if a change will increase final cost', 'Every change includes cost and schedule impact'],
      ['Delay is blamed on you even when material was pending', 'Delay cause is always documented'],
      ['You cannot understand the progress report you received', 'Progress status is visible in real time'],
      ['You do surprise site visits because you do not trust updates', 'You get full visibility without disturbing anyone'],
    ],
    featuresTitle: 'Everything you can see as a homeowner',
    featuresSubtitle: 'Total visibility without interfering with contractor operations.',
    features: [
      {
        title: 'Real-time project feed',
        text: 'Every action - photo uploaded, task completed, change approved - appears in the feed. You see the same project reality as the contractor.',
        icon: Eye,
      },
      {
        title: 'Proactive alerts',
        text: 'When something relevant happens, you get notified. No more anxiety wondering what is happening on site.',
        icon: Bell,
      },
      {
        title: 'Photo documentation',
        text: 'Site photos become automatically visible in the project. Track each area day by day without unscheduled inspections.',
        icon: Camera,
      },
      {
        title: 'Clear milestones and deadlines',
        text: 'The project timeline is shared. You know what to expect and receive alerts if something slips, with documented cause.',
        icon: CalendarDays,
      },
      {
        title: 'Financial transparency',
        text: 'See budget, approved costs, and progress status. Scope changes arrive as formal change requests with explicit impact.',
        icon: Wallet,
      },
      {
        title: 'Direct project channel',
        text: 'Project chat keeps communication in context, linked to tasks and documents. No more lost emails or scattered messages.',
        icon: MessageCircle,
      },
    ],
    finalTitle: 'Ready to bring order to your construction site?',
    finalText: 'Stop wasting time across chats, emails, and calls. Start with EdilSync today and see the difference from day one.',
    finalCta: 'Start 30-Day Free Trial',
    finalNote: 'No credit card - 2-minute setup - Cancel anytime',
  },
};

export default function TransparencyPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => contentByLocale[locale] || contentByLocale.it, [locale]);
  const basePath = locale === 'en' ? '/en' : '';
  const canonicalPath = locale === 'en' ? '/en/transparency' : '/transparency';

  usePublicGsap(rootRef);

  usePublicSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath,
    locale,
    alternateItPath: '/transparency',
    alternateEnPath: '/en/transparency',
  });

  return (
    <div ref={rootRef} className="min-h-screen bg-[#fcfcfc] font-inter">
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div data-reveal>
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#fff0eb] text-[#ef6144] text-sm font-medium mb-4">{copy.badge}</span>
            <h1 className="font-bold text-4xl md:text-5xl text-[#141821] tracking-tight leading-tight">
              {copy.title}{' '}
              <span className="text-[#ef6144]">{copy.titleHighlight}</span>
            </h1>
            <p className="mt-5 text-lg text-[#5b6470] leading-relaxed">{copy.subtitle}</p>
            <p className="mt-3 text-sm text-[#ef6144] font-semibold">{`✓ ${copy.note}`}</p>
            <Button asChild className="bg-[#ef6144] text-white hover:bg-[#d9553a] h-10 mt-6 rounded-full px-8 gap-2 shadow-lg shadow-[rgba(239,97,68,0.25)]">
              <Link to="/app">
                {copy.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div data-reveal>
            <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8">
              <Quote className="w-8 h-8 text-[#ef6144]/30 mb-4" />
              <p className="text-[#141821] font-medium leading-relaxed">{copy.quote}</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ef6144]/10 flex items-center justify-center font-bold text-[#ef6144] text-sm">S</div>
                <div>
                  <p className="font-semibold text-sm text-[#141821]">{copy.quoteAuthor}</p>
                  <p className="text-xs text-[#6b7280]">{copy.quoteRole}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f3f4f680] px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <h2 className="font-bold text-3xl text-[#141821] tracking-tight">{copy.compareTitle}</h2>
          </div>
          <div className="space-y-3">
            {copy.compareRows.map((row) => (
              <div key={row[0]} className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-reveal>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <span className="text-red-400 mt-0.5 flex-shrink-0 text-lg leading-none">✕</span>
                  <p className="text-sm text-[#5b6470]">{row[0]}</p>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-[#ef6144]/5 border border-[#ef6144]/10">
                  <CircleCheck className="w-4 h-4 text-[#ef6144] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-[#5b6470]">{row[1]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#fcfcfc]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <h2 className="font-bold text-3xl text-[#141821] tracking-tight">{copy.featuresTitle}</h2>
            <p className="mt-3 text-[#5b6470]">{copy.featuresSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {copy.features.map((item) => (
              <div key={item.title} className="p-6 rounded-2xl bg-white border border-[#e5e7eb] hover:border-[#ef6144]/20 hover:shadow-lg transition-all" data-reveal>
                <div className="w-11 h-11 rounded-xl bg-[#ef6144]/10 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-[#ef6144]" />
                </div>
                <h3 className="font-semibold text-[#141821]">{item.title}</h3>
                <p className="mt-2 text-sm text-[#5b6470] leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
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
