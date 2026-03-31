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
    title: 'Ogni parola è scritta.',
    titleHighlight: 'Ogni accordo è provato.',
    subtitle:
      'Nel settore edile, i margini sono del 3-5%. Una sola disputa non documentata può azzerare il profitto di un intero progetto. EdilSync ti protegge automaticamente, senza lavoro extra.',
    cta: 'Crea account azienda',
    note: 'Funziona per contractor, committenti, subappaltatori e professionisti.',
    scenarioLabel: 'Lo scenario tipico',
    scenarioQuote:
      '"Ho perso €4.200 su un progetto da €28.000 per una disputa su due stanze che erano già incluse secondo il cliente. Non avevo niente di scritto. Avevo solo la mia parola."',
    scenarioAuthor: 'Giuseppe',
    scenarioRole: 'Contractor, Torino - prima di EdilSync',
    issuesTitle: 'Le dispute più frequenti - e come le elimini',
    issuesSubtitle: 'Ogni scenario che hai vissuto ha una risposta documentale precisa.',
    issues: [
      {
        title: '"Pensavo fosse incluso nel preventivo"',
        text: 'Le change request documentano ogni variante con impatto su costi e tempi. Il committente approva o rifiuta. Tutto con data e ora, tutto immutabile.',
        icon: FileText,
      },
      {
        title: '"Non sapevo che fossi io in ritardo"',
        text: 'I task bloccati registrano nome del responsabile e data. Se il ritardo è causato da una scelta del committente, è scritto nero su bianco.',
        icon: Clock3,
      },
      {
        title: '"Quella foto non prova niente, era già così"',
        text: 'Le foto sono associate al task specifico con data e ora. Lo stato iniziale e finale di ogni area è documentato automaticamente.',
        icon: Camera,
      },
      {
        title: '"Ma me l’avevi detto per telefono"',
        text: 'Tutta la comunicazione avviene in-app con riferimenti strutturati. Nessuna conversazione rilevante finisce su WhatsApp o email personale.',
        icon: Scale,
      },
    ],
    flowTitle: 'Come funziona la protezione',
    flowSubtitle: 'Non è un modulo extra da compilare. È il risultato del tuo lavoro quotidiano.',
    flowSteps: [
      {
        title: 'Le tue azioni diventano prove',
        text: 'Ogni foto scattata, ogni task aggiornato, ogni approvazione ricevuta viene registrata automaticamente con timestamp nel feed del progetto. Non devi fare nulla di extra.',
      },
      {
        title: 'Le varianti sono formalizzate',
        text: 'Quando il committente chiede una modifica, si apre una change request con descrizione, impatto economico e impatto sulle tempistiche. L’approvazione è digitale e immutabile.',
      },
      {
        title: 'I ritardi hanno un nome',
        text: 'I task possono essere marcati come bloccati con la causa e il responsabile. Se stai aspettando una decisione del committente, questo è documentato con data e ora.',
      },
      {
        title: 'Le dispute sono gestite formalmente',
        text: 'In caso di conflitto, si apre una disputa formale con timeline eventi, prove allegate e commenti. Tutto in un posto, tutto tracciato. Nessuna parola contro parola.',
      },
    ],
    roiTitle: 'Una disputa evitata vale mesi di abbonamento',
    roiText:
      'Una disputa media in cantiere costa tra 200 e 2.000 euro tra tempo, rilavorazioni e margine perso. EdilSync costa 19 euro al mese. Il ritorno si calcola da solo.',
    roiCards: [
      { value: '€300', label: 'Costo medio di una disputa piccola' },
      { value: '€19/mese', label: 'Costo di EdilSync' },
      { value: '15x', label: 'ROI con una sola disputa evitata all anno' },
    ],
    finalTitle: 'Pronto a portare ordine nel tuo cantiere?',
    finalText:
      'Smetti di perdere tempo tra chat, email e telefonate. Inizia oggi con EdilSync e vedi la differenza dal primo giorno.',
    finalCta: 'Crea account azienda',
    finalNote: 'Società free o Pro - Nessuna carta per iniziare - Upgrade quando serve',
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
    cta: 'Create company account',
    note: 'Built for contractors, owners, subcontractors, and technical professionals.',
    scenarioLabel: 'Typical scenario',
    scenarioQuote:
      '"I lost €4,200 on a €28,000 project because of a dispute on two rooms the client said were already included. I had nothing documented. Only my word."',
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
      'An average construction dispute can cost between €200 and €2,000 in time, rework, and lost margin. EdilSync costs €19 per month. ROI is straightforward.',
    roiCards: [
      { value: '€300', label: 'Average cost of a minor dispute' },
      { value: '€19/month', label: 'EdilSync cost' },
      { value: '15x', label: 'ROI with one avoided dispute per year' },
    ],
    finalTitle: 'Ready to bring order to your construction site?',
    finalText:
      'Stop wasting time between chats, emails, and phone calls. Start with EdilSync today and feel the difference from day one.',
    finalCta: 'Create company account',
    finalNote: 'Free or Pro company - No card required to start - Upgrade when needed',
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
    <div ref={rootRef} className={PUBLIC_CLASSES.page}>
      <section className="public-section-shell pt-32 pb-[4.5rem] md:pb-24">
        <div className="mx-auto grid max-w-6xl px-4 sm:px-6 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center">
          <div className="relative overflow-hidden rounded-[32px] border border-[var(--public-line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,246,240,0.88))] p-8 shadow-[0_30px_80px_rgba(37,25,20,0.08)] md:p-10" data-reveal>
            <div className="absolute -left-14 top-10 h-36 w-36 rounded-full bg-[rgba(239,97,68,0.14)] blur-3xl" aria-hidden />
            <span className="public-eyebrow">{copy.badge}</span>
            <h1 className={`mt-5 ${PUBLIC_CLASSES.displayH1}`}>
              {copy.title}{' '}
              <span className="text-[var(--public-accent)]">{copy.titleHighlight}</span>
            </h1>
            <p className={`mt-6 max-w-2xl ${PUBLIC_CLASSES.bodyLead}`}>{copy.subtitle}</p>
            <div className="mt-6 flex items-center gap-4">
              <Button asChild className="h-11 rounded-full bg-[linear-gradient(135deg,#ef6144,#d9553a)] px-8 text-white shadow-[0_20px_44px_rgba(223,88,59,0.28)] hover:bg-[linear-gradient(135deg,#e55a3d,#c94d35)]">
                <Link to="/app">
                  {copy.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p className="mt-4 rounded-full border border-[rgba(239,97,68,0.18)] bg-[rgba(255,240,232,0.82)] px-4 py-2 text-sm font-semibold text-[var(--public-accent-dark)]">{copy.note}</p>
          </div>

          <div className="public-device-frame self-start p-5 md:p-6" data-reveal>
            <div className="rounded-[28px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,247,242,0.92))] p-7 shadow-[0_18px_50px_rgba(52,35,29,0.1)]">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(196,77,53,0.1)]">
                <AlertTriangle className="h-6 w-6 text-[#c34e36]" />
              </div>
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.12em] text-[var(--public-muted)]">{copy.scenarioLabel}</p>
              <Quote className="mb-2 h-6 w-6 text-[var(--public-accent)]/30" />
              <p className="font-medium leading-8 text-[var(--public-ink)]">{copy.scenarioQuote}</p>
              <div className="mt-6 flex items-center gap-3 border-t border-[var(--public-line)] pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(239,97,68,0.1)] text-sm font-bold text-[var(--public-accent)]">G</div>
                <div>
                  <p className="text-sm font-semibold text-[var(--public-ink)]">{copy.scenarioAuthor}</p>
                  <p className="text-xs text-[var(--public-muted)]">{copy.scenarioRole}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center" data-reveal>
            <h2 className={PUBLIC_CLASSES.sectionH2}>{copy.issuesTitle}</h2>
            <p className={`mx-auto mt-4 max-w-2xl ${PUBLIC_CLASSES.bodyBase}`}>{copy.issuesSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {copy.issues.map((item) => (
              <div key={item.title} className="rounded-[24px] border border-[var(--public-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,250,246,0.92))] p-6 shadow-[0_14px_34px_rgba(42,28,23,0.05)]" data-reveal>
                <p className="mb-4 text-sm font-medium italic text-[#c34e36]">{item.title}</p>
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(239,97,68,0.12)]">
                    <item.icon className="h-4 w-4 text-[var(--public-accent)]" />
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--public-muted)]">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-[5.5rem]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-12 text-center" data-reveal>
            <span className="public-eyebrow">{locale === 'en' ? 'Protection flow' : 'Flusso di tutela'}</span>
            <h2 className={`mt-5 ${PUBLIC_CLASSES.sectionH2}`}>{copy.flowTitle}</h2>
            <p className={`mx-auto mt-4 max-w-2xl ${PUBLIC_CLASSES.bodyBase}`}>{copy.flowSubtitle}</p>
          </div>
          <div className="space-y-5">
            {copy.flowSteps.map((step, index) => (
              <div key={step.title} className={`flex gap-6 p-6 ${PUBLIC_CLASSES.card}`} data-reveal>
                <span className={PUBLIC_CLASSES.cardStepNumber}>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-lg font-bold text-[var(--public-ink)]">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--public-muted)]">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center" data-reveal>
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(239,97,68,0.12)]">
            <Stamp className="h-7 w-7 text-[var(--public-accent)]" />
          </div>
          <h2 className={PUBLIC_CLASSES.sectionH2}>{copy.roiTitle}</h2>
          <p className={`mx-auto mt-4 max-w-2xl ${PUBLIC_CLASSES.bodyBase}`}>{copy.roiText}</p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {copy.roiCards.map((item, index) => (
              <div key={item.value} className="public-grid-card p-5">
                <p className="text-2xl font-bold text-[var(--public-accent)]">{item.value}</p>
                <p className="mt-1 text-sm text-[var(--public-muted)]">{item.label}</p>
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
