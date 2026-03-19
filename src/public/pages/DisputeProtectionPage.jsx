import React, { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Camera, Clock3, FileText, Quote, Scale, Stamp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';

const contentByLocale = {
  it: {
    seoTitle: 'Protezione Dispute',
    seoDescription:
      'Riduci le dispute in cantiere con prove contestuali, change request tracciate e comunicazione strutturata in un unico spazio.',
    badge: 'Protezione dalle Dispute',
    title: 'Ogni parola e scritta.',
    titleHighlight: 'Ogni accordo e provato.',
    subtitle:
      'Nel settore edile, i margini sono del 3-5%. Una sola disputa non documentata puo azzerare il profitto di un intero progetto. EdilSync ti protegge automaticamente, senza lavoro extra.',
    cta: 'Inizia Gratis',
    note: 'Funziona per contractor, committenti, subappaltatori e professionisti.',
    scenarioLabel: 'Il scenario tipico',
    scenarioQuote:
      '"Ho perso EUR4.200 su un progetto da EUR28.000 per una disputa su due stanze che erano gia incluse secondo il cliente. Non avevo niente di scritto. Avevo solo la mia parola."',
    scenarioAuthor: 'Giuseppe',
    scenarioRole: 'Contractor, Torino - prima di EdilSync',
    issuesTitle: 'Le dispute piu frequenti - e come le elimini',
    issuesSubtitle: 'Ogni scenario che hai vissuto ha una risposta documentale precisa.',
    issues: [
      {
        title: '"Pensavo fosse incluso nel preventivo"',
        text: 'Le change request documentano ogni variante con impatto su costi e tempi. Il committente approva o rifiuta. Tutto time-stamped, tutto immutabile.',
        icon: FileText,
      },
      {
        title: '"Non sapevo che fossi io in ritardo"',
        text: 'I task bloccati registrano nome del responsabile e data. Se il ritardo e causato da una scelta del committente, e scritto nero su bianco.',
        icon: Clock3,
      },
      {
        title: '"Quella foto non prova niente, era gia cosi"',
        text: 'Le foto sono time-stamped e associate al task specifico. Lo stato iniziale e finale di ogni area e documentato automaticamente.',
        icon: Camera,
      },
      {
        title: '"Ma me l avevi detto per telefono"',
        text: 'Tutta la comunicazione avviene in-app con riferimenti strutturati. Nessuna conversazione rilevante finisce su WhatsApp o email personale.',
        icon: Scale,
      },
    ],
    flowTitle: 'Come funziona la protezione',
    flowSubtitle: 'Non e un modulo extra da compilare. E il risultato del tuo lavoro quotidiano.',
    flowSteps: [
      {
        title: 'Le tue azioni diventano prove',
        text: 'Ogni foto scattata, ogni task aggiornato, ogni approvazione ricevuta viene registrata automaticamente con timestamp nel feed del progetto. Non devi fare nulla di extra.',
      },
      {
        title: 'Le varianti sono formalizzate',
        text: 'Quando il committente chiede una modifica, si apre una change request con descrizione, impatto economico e impatto sulle tempistiche. L approvazione e digitale e immutabile.',
      },
      {
        title: 'I ritardi hanno un nome',
        text: 'I task possono essere marcati come bloccati con la causa e il responsabile. Se stai aspettando una decisione del committente, questo e documentato con data e ora.',
      },
      {
        title: 'Le dispute sono gestite formalmente',
        text: 'In caso di conflitto, si apre una disputa formale con timeline eventi, prove allegate e commenti. Tutto in un posto, tutto tracciato. Nessuna parola contro parola.',
      },
    ],
    roiTitle: 'Una disputa evitata vale mesi di abbonamento',
    roiText:
      'La disputa media in cantiere costa tra EUR200 e EUR2.000 tra tempo, rilavorazioni e margine perso. EdilSync costa EUR19 al mese. Il ROI si calcola da solo.',
    roiCards: [
      { value: 'EUR300', label: 'Costo medio di una disputa piccola' },
      { value: 'EUR19/mese', label: 'Costo di EdilSync' },
      { value: '15x', label: 'ROI con una sola disputa evitata all anno' },
    ],
    finalTitle: 'Pronto a portare ordine nel tuo cantiere?',
    finalText:
      'Smetti di perdere tempo tra chat, email e telefonate. Inizia oggi con EdilSync e vedi la differenza dal primo giorno.',
    finalCta: 'Inizia Gratis per 30 Giorni',
    finalNote: 'Nessuna carta di credito - Setup in 2 minuti - Cancella quando vuoi',
  },
  en: {
    seoTitle: 'Dispute Protection',
    seoDescription:
      'Reduce jobsite disputes with contextual proof, traceable change requests, and structured communication in one workspace.',
    badge: 'Dispute Protection',
    title: 'Every word is written.',
    titleHighlight: 'Every agreement is provable.',
    subtitle:
      'In construction, margins are often 3-5%. One undocumented dispute can erase profit on an entire project. EdilSync protects you automatically, without extra admin work.',
    cta: 'Start Free',
    note: 'Built for contractors, owners, subcontractors, and technical professionals.',
    scenarioLabel: 'Typical scenario',
    scenarioQuote:
      '"I lost EUR4,200 on a EUR28,000 project because of a dispute on two rooms the client said were already included. I had nothing documented. Only my word."',
    scenarioAuthor: 'Giuseppe',
    scenarioRole: 'Contractor, Turin - before EdilSync',
    issuesTitle: 'The most common disputes - and how you prevent them',
    issuesSubtitle: 'Every painful scenario has a clear documentary response.',
    issues: [
      {
        title: '"I thought it was included in the quote"',
        text: 'Change requests document every variation with cost and schedule impact. The owner approves or rejects. Everything is time-stamped and immutable.',
        icon: FileText,
      },
      {
        title: '"I did not know the delay was on me"',
        text: 'Blocked tasks register owner, date, and reason. If delay depends on a client decision, it is clearly recorded.',
        icon: Clock3,
      },
      {
        title: '"That photo proves nothing"',
        text: 'Photos are time-stamped and linked to the specific task. Initial and final state of each area is documented automatically.',
        icon: Camera,
      },
      {
        title: '"But I told you on the phone"',
        text: 'All key communication lives in-app with structured references. No critical decisions are buried in private chats or email.',
        icon: Scale,
      },
    ],
    flowTitle: 'How the protection works',
    flowSubtitle: 'It is not an extra form to fill. It is the result of your daily operations.',
    flowSteps: [
      {
        title: 'Your actions become evidence',
        text: 'Every photo, task update, and approval is automatically recorded with timestamp in the project feed. No extra effort required.',
      },
      {
        title: 'Variations are formalized',
        text: 'When scope changes, a change request captures description, time impact, and cost impact. Approval is digital and immutable.',
      },
      {
        title: 'Delays have named responsibility',
        text: 'Tasks can be marked blocked with cause and accountable party. Waiting on a client decision is documented with date and time.',
      },
      {
        title: 'Disputes are handled formally',
        text: 'If conflict starts, open a formal dispute with event timeline, attached evidence, and comments. Everything in one place, fully traceable.',
      },
    ],
    roiTitle: 'One avoided dispute is worth months of subscription',
    roiText:
      'An average construction dispute can cost between EUR200 and EUR2,000 in time, rework, and lost margin. EdilSync costs EUR19 per month. ROI is straightforward.',
    roiCards: [
      { value: 'EUR300', label: 'Average cost of a minor dispute' },
      { value: 'EUR19/month', label: 'EdilSync cost' },
      { value: '15x', label: 'ROI with one avoided dispute per year' },
    ],
    finalTitle: 'Ready to bring order to your construction site?',
    finalText:
      'Stop wasting time between chats, emails, and phone calls. Start with EdilSync today and feel the difference from day one.',
    finalCta: 'Start 30-Day Free Trial',
    finalNote: 'No credit card - 2-minute setup - Cancel anytime',
  },
};

export default function DisputeProtectionPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => contentByLocale[locale] || contentByLocale.it, [locale]);
  const basePath = locale === 'en' ? '/en' : '';
  const canonicalPath = locale === 'en' ? '/en/dispute-protection' : '/dispute-protection';

  usePublicGsap(rootRef);

  usePublicSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath,
    locale,
    alternateItPath: '/dispute-protection',
    alternateEnPath: '/en/dispute-protection',
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
            <div className="mt-6 flex items-center gap-4">
              <Button asChild className="bg-[#ef6144] text-white hover:bg-[#d9553a] h-10 rounded-full px-8 gap-2 shadow-lg shadow-[rgba(239,97,68,0.25)]">
                <Link to="/app">
                  {copy.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p className="mt-3 text-sm text-[#6b7280]">{copy.note}</p>
          </div>

          <div data-reveal>
            <div className="bg-white rounded-2xl border border-[#e5e7eb] p-8">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-5">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-[#6b7280] text-sm mb-4 font-medium uppercase tracking-wide">{copy.scenarioLabel}</p>
              <Quote className="w-6 h-6 text-[#ef6144]/30 mb-2" />
              <p className="text-[#141821] font-medium leading-relaxed">{copy.scenarioQuote}</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ef6144]/10 flex items-center justify-center font-bold text-[#ef6144] text-sm">G</div>
                <div>
                  <p className="font-semibold text-sm text-[#141821]">{copy.scenarioAuthor}</p>
                  <p className="text-xs text-[#6b7280]">{copy.scenarioRole}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f3f4f680] px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <h2 className="font-bold text-3xl text-[#141821] tracking-tight">{copy.issuesTitle}</h2>
            <p className="mt-3 text-[#5b6470]">{copy.issuesSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {copy.issues.map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-[#e5e7eb] p-6" data-reveal>
                <p className="text-sm font-medium text-red-500 mb-4 italic">{item.title}</p>
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#ef6144]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon className="w-4 h-4 text-[#ef6144]" />
                  </div>
                  <p className="text-sm text-[#5b6470] leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#fcfcfc]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12" data-reveal>
            <h2 className="font-bold text-3xl text-[#141821] tracking-tight">{copy.flowTitle}</h2>
            <p className="mt-3 text-[#5b6470]">{copy.flowSubtitle}</p>
          </div>
          <div className="space-y-5">
            {copy.flowSteps.map((step, index) => (
              <div key={step.title} className="flex gap-6 p-6 rounded-2xl border border-[#e5e7eb] bg-white" data-reveal>
                <span className="font-bold text-4xl text-[#ef6144]/20 leading-none flex-shrink-0">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="font-bold text-lg text-[#141821]">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-[#5b6470] leading-relaxed">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-[#f3f4f680] px-6">
        <div className="max-w-3xl mx-auto text-center" data-reveal>
          <div className="w-14 h-14 rounded-2xl bg-[#ef6144]/10 flex items-center justify-center mx-auto mb-6">
            <Stamp className="w-7 h-7 text-[#ef6144]" />
          </div>
          <h2 className="font-bold text-3xl text-[#141821] tracking-tight">{copy.roiTitle}</h2>
          <p className="mt-4 text-[#5b6470] leading-relaxed">{copy.roiText}</p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {copy.roiCards.map((item) => (
              <div key={item.value} className="p-5 rounded-2xl bg-white border border-[#e5e7eb]">
                <p className="font-bold text-2xl text-[#ef6144]">{item.value}</p>
                <p className="mt-1 text-sm text-[#6b7280]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-[#0b1220] relative overflow-hidden">
        <div data-parallax="slow" className="absolute top-0 left-1/3 w-96 h-96 bg-[#ef6144]/20 rounded-full blur-3xl pointer-events-none" />
        <div data-parallax="medium" className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#ef6144]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10" data-reveal>
          <h2 className={`${PUBLIC_CLASSES.darkDisplayH2}`}>{copy.finalTitle}</h2>
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
