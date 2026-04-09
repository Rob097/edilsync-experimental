import React, { useMemo, useRef } from 'react';
import {
  CalendarDays,
  FileText,
  Globe,
  Layers,
  MessageCircle,
  Users,
} from 'lucide-react';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import PublicPrimaryCta from '@/public/components/marketing/PublicPrimaryCta';
import MarketingFinalCtaSection from '@/public/components/marketing/MarketingFinalCtaSection';
import EntitlementHint from '@/public/components/marketing/EntitlementHint';

const contentByLocale = {
  it: {
    seoTitle: 'Per i Professionisti Tecnici',
    seoDescription:
      'Pagina dedicata ai professionisti tecnici: accesso gratuito ai cantieri invitati, con gestione documentale avanzata e coordinamento strutturato nei cantieri sponsorizzati.',
    badge: 'Per i Professionisti Tecnici',
    title: 'Il tuo spazio di lavoro condiviso con impresa e committente',
    subtitle:
      'Architetti, ingegneri, geometri e designer. Entri gratis nei cantieri in cui vieni invitato e, quando il cantiere è sponsorizzato, lavori con documenti avanzati, milestone e chat contestuale completa.',
    note: 'Accesso gratuito nei cantieri invitati. Gli strumenti avanzati di cantiere si attivano nei cantieri sponsorizzati.',
    ctaTop: 'Apri account gratis',
    rolesTitle: 'Per ogni figura professionale',
    roles: [
      {
        title: 'Architetti',
        text: 'Coordina esecutivo, varianti e approvazioni con committente e impresa in un unico spazio. I tuoi elaborati tecnici sempre accessibili a tutti.',
      },
      {
        title: 'Ingegneri strutturali',
        text: 'Documenta calcoli, relazioni e collaudi. Tieni traccia di ogni modifica strutturale e della sua approvazione nel tempo.',
      },
      {
        title: 'Geometri',
        text: 'Gestisci pratiche, documentazione catastale e DL. Coordinati con impresa e committente senza email sparse.',
      },
      {
        title: 'Interior designer',
        text: 'Condividi tavole, materiali e revisioni. Le change request documentano ogni variante di cantiere concordata con il cliente.',
      },
      {
        title: 'Consulenti tecnici',
        text: 'Accedi al cantiere nel tuo contesto, vedi i documenti rilevanti e comunica con tutte le parti senza dover gestire accessi multipli.',
      },
    ],
    featuresTitle: 'Funzionalità pensate per i professionisti',
    features: [
      {
        title: 'Viewer BIM integrato',
        text: 'Nei cantieri sponsorizzati, carica IFC, GLB e GLTF e visualizza i modelli 3D direttamente in piattaforma, condividendoli con committente e impresa.',
        icon: Globe,
        badge: 'Cantiere sponsorizzato',
      },
      {
        title: 'Gestione documentale avanzata',
        text: 'Nei cantieri sponsorizzati, disciplina, fase, stato, revisioni e tag tengono ogni documento ricercabile, verificabile e gestito correttamente.',
        icon: FileText,
        badge: 'Cantiere sponsorizzato',
      },
      {
        title: 'Calendario condiviso',
        text: 'Sopralluoghi, riunioni, scadenze - tutto coordinato con tutti gli attori del cantiere in un calendario unificato.',
        icon: CalendarDays,
      },
      {
        title: 'Chat di cantiere strutturata',
        text: 'Nei cantieri sponsorizzati, i messaggi possono riferirsi a documenti, task e milestone. Non più email infinite per ogni aggiornamento.',
        icon: MessageCircle,
        badge: 'Cantiere sponsorizzato',
      },
      {
        title: 'Accesso contestuale',
        text: 'Il tuo profilo professionista ti permette di lavorare su più cantieri con ruoli diversi. Un solo account per tutto.',
        icon: Layers,
      },
      {
        title: 'Coordinamento multi-attore',
        text: 'Sei il punto di raccordo tra committente e impresa. EdilSync rende questa mediazione strutturata e tracciabile.',
        icon: Users,
      },
    ],
    finalTitle: 'Pronto a portare ordine nel tuo cantiere?',
    finalText:
      'Smetti di perdere tempo tra chat, email e telefonate. Inizia oggi con EdilSync e vedi la differenza dal primo giorno.',
    finalCta: 'Apri account gratis',
    finalNote: 'Account unico · Accesso gratuito nei cantieri invitati · Strumenti avanzati nei cantieri sponsorizzati',
  },
  en: {
    seoTitle: 'For Technical Professionals',
    seoDescription:
      'Dedicated page for technical professionals: free access on invited worksites, with advanced document management and structured coordination on sponsored worksites.',
    badge: 'For Technical Professionals',
    title: 'Your shared workspace with contractor and owner',
    subtitle:
      'Architects, engineers, surveyors, and designers. You join invited worksites for free and, when the worksite is sponsored, work with advanced documents, milestones, and fully contextual chat.',
    note: 'Free access on invited worksites. Premium worksite surfaces unlock on sponsored worksites.',
    ctaTop: 'Open free account',
    rolesTitle: 'For every professional profile',
    roles: [
      {
        title: 'Architects',
        text: 'Coordinate executive design, changes, and approvals with owner and contractor in one shared space. Your technical outputs stay accessible and aligned.',
      },
      {
        title: 'Structural engineers',
        text: 'Document calculations, reports, and structural checks. Track every structural change and its approval over time.',
      },
      {
        title: 'Surveyors',
        text: 'Manage permits, cadastral documentation, and site supervision. Coordinate with owner and contractor without fragmented emails.',
      },
      {
        title: 'Interior designers',
        text: 'Share boards, materials, and revisions. Change requests document every agreed design variation with the client.',
      },
      {
        title: 'Technical consultants',
        text: 'Access the worksite in your role context, see relevant documents, and communicate with all stakeholders without multi-account overhead.',
      },
    ],
    featuresTitle: 'Features built for technical professionals',
    features: [
      {
        title: 'Integrated BIM viewer',
        text: 'On sponsored worksites, upload IFC, GLB, and GLTF and review 3D models directly in platform while sharing context with owners and contractors.',
        icon: Globe,
        badge: 'Sponsored worksite',
      },
      {
        title: 'Advanced document management',
        text: 'On sponsored worksites, discipline, phase, status, revisions, and tags keep every document searchable, auditable, and easy to manage.',
        icon: FileText,
        badge: 'Sponsored worksite',
      },
      {
        title: 'Shared calendar',
        text: 'Site visits, meetings, deadlines - fully coordinated across all worksite participants in one unified calendar.',
        icon: CalendarDays,
      },
      {
        title: 'Structured worksite chat',
        text: 'On sponsored worksites, messages can link to docs, tasks, and milestones. No more endless email threads for each update.',
        icon: MessageCircle,
        badge: 'Sponsored worksite',
      },
      {
        title: 'Contextual access',
        text: 'Your professional profile can work across multiple worksites with different roles. One account for everything.',
        icon: Layers,
      },
      {
        title: 'Multi-actor coordination',
        text: 'You are often the bridge between owner and contractor. EdilSync makes that mediation structured and traceable.',
        icon: Users,
      },
    ],
    finalTitle: 'Ready to bring order to your construction site?',
    finalText: 'Stop wasting time across chats, emails, and calls. Start today with EdilSync and feel the difference from day one.',
    finalCta: 'Open free account',
    finalNote: 'Single account · Free access on invited worksites · Premium on sponsored worksites',
  },
};

export default function ProfessionalsPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => contentByLocale[locale] || contentByLocale.it, [locale]);
  const basePath = locale === 'en' ? '/en' : '';
  const canonicalPath = locale === 'en' ? '/en/per-tecnici' : '/per-tecnici';

  usePublicGsap(rootRef);

  usePublicSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath,
    locale,
    alternateItPath: '/per-tecnici',
    alternateEnPath: '/en/per-tecnici',
  });

  return (
    <div ref={rootRef} className={PUBLIC_CLASSES.page}>
      <section className="public-section-shell pt-32 pb-[4.5rem] md:pb-[5.5rem]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <span data-reveal className="public-eyebrow">
            {copy.badge}
          </span>
          <h1 data-reveal className={`mt-5 ${PUBLIC_CLASSES.displayH1}`}>
            {copy.title}
          </h1>
          <p data-reveal className={`mx-auto mt-5 max-w-3xl ${PUBLIC_CLASSES.bodyLead}`}>
            {copy.subtitle}
          </p>
          <p data-reveal className="mx-auto mt-4 max-w-2xl rounded-full border border-[rgba(239,97,68,0.18)] bg-[rgba(255,240,232,0.82)] px-4 py-2 text-sm font-semibold text-[var(--public-accent-dark)]">
            {copy.note}
          </p>
          <PublicPrimaryCta className="mt-8" to="/app" label={copy.ctaTop} />
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl" data-reveal>
            <span className="public-eyebrow">{locale === 'en' ? 'Professional contexts' : 'Contesti professionali'}</span>
            <h2 className={`mt-5 ${PUBLIC_CLASSES.sectionH2}`}>{copy.rolesTitle}</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12">
            {copy.roles.map((role, index) => (
              <article
                key={role.title}
                data-reveal
                className={`${PUBLIC_CLASSES.card} p-6 ${index === 0 ? 'xl:col-span-6' : index === 1 ? 'xl:col-span-3' : index === 2 ? 'xl:col-span-3' : index === 3 ? 'xl:col-span-4' : 'xl:col-span-4'}`}
              >
                <h3 className={`${PUBLIC_CLASSES.sectionH3} mb-2`}>{role.title}</h3>
                <p className={PUBLIC_CLASSES.bodySm}>{role.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-[5.5rem]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl" data-reveal>
            <span className="public-eyebrow">{locale === 'en' ? 'Technical workflow' : 'Flusso tecnico'}</span>
            <h2 className={`mt-5 ${PUBLIC_CLASSES.sectionH2}`}>{copy.featuresTitle}</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12">
            {copy.features.map((item, index) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  data-reveal
                  className={`relative p-6 ${PUBLIC_CLASSES.card} ${PUBLIC_CLASSES.cardHover} ${index === 0 ? 'xl:col-span-5' : index === 1 ? 'xl:col-span-4' : index === 2 ? 'xl:col-span-3' : index === 3 ? 'xl:col-span-4' : index === 4 ? 'xl:col-span-3' : 'xl:col-span-5'}`}
                >
                  <EntitlementHint label={item.badge} className="absolute right-4 top-4" />
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
