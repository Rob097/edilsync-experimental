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

const contentByLocale = {
  it: {
    seoTitle: 'Per i Professionisti Tecnici',
    seoDescription:
      'Pagina dedicata ai professionisti tecnici: spazio condiviso con impresa e committente, gestione documentale avanzata e coordinamento strutturato.',
    badge: 'Per i Professionisti Tecnici',
    title: 'Il tuo spazio di lavoro condiviso con impresa e committente',
    subtitle:
      'Architetti, ingegneri, geometri e designer. Ogni progettista ha un ruolo chiave nel cantiere - EdilSync lo rende strutturato.',
    ctaTop: 'Inizia Gratis',
    rolesTitle: 'Per ogni figura professionale',
    roles: [
      {
        title: 'Architetti',
        text: 'Coordina progetto esecutivo, varianti e approvazioni con committente e impresa in un unico spazio. I tuoi elaborati tecnici sempre accessibili a tutti.',
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
        text: 'Condividi tavole, materiali e revisioni. Le change request documentano ogni variante di progetto concordata con il cliente.',
      },
      {
        title: 'Consulenti tecnici',
        text: 'Accedi al progetto nel tuo contesto, vedi i documenti rilevanti e comunica con tutte le parti senza dover gestire accessi multipli.',
      },
    ],
    featuresTitle: 'Funzionalita pensate per i professionisti',
    features: [
      {
        title: 'Viewer BIM integrato',
        text: 'Carica IFC, GLB e GLTF. Visualizza i modelli 3D direttamente in piattaforma, condividili con committente e impresa.',
        icon: Globe,
      },
      {
        title: 'Gestione documentale avanzata',
        text: 'Disciplina, fase, stato, revisioni, tag. Ogni documento ha i metadati giusti per essere trovato e gestito correttamente.',
        icon: FileText,
      },
      {
        title: 'Calendario condiviso',
        text: 'Sopralluoghi, riunioni, scadenze - tutto coordinato con tutti gli attori del progetto in un calendario unificato.',
        icon: CalendarDays,
      },
      {
        title: 'Chat di progetto strutturata',
        text: 'Messaggi con riferimenti a documenti, task e milestone. Non piu email infinite per ogni aggiornamento.',
        icon: MessageCircle,
      },
      {
        title: 'Accesso contestuale',
        text: 'Il tuo profilo professionista ti permette di lavorare su piu progetti con ruoli diversi. Un solo account per tutto.',
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
    finalCta: 'Inizia Gratis per 30 Giorni',
    finalNote: 'Nessuna carta di credito · Setup in 2 minuti · Cancella quando vuoi',
  },
  en: {
    seoTitle: 'For Technical Professionals',
    seoDescription:
      'Dedicated page for technical professionals: shared workspace with contractors and owners, advanced document management, and structured coordination.',
    badge: 'For Technical Professionals',
    title: 'Your shared workspace with contractor and owner',
    subtitle:
      'Architects, engineers, surveyors, and designers. Every technical professional has a key role on site - EdilSync makes it structured.',
    ctaTop: 'Start Free',
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
        text: 'Access the project in your role context, see relevant documents, and communicate with all stakeholders without multi-account overhead.',
      },
    ],
    featuresTitle: 'Features built for technical professionals',
    features: [
      {
        title: 'Integrated BIM viewer',
        text: 'Upload IFC, GLB, and GLTF. Review 3D models directly in platform and share context with owners and contractors.',
        icon: Globe,
      },
      {
        title: 'Advanced document management',
        text: 'Discipline, phase, status, revisions, tags. Every document gets the right metadata to stay searchable and auditable.',
        icon: FileText,
      },
      {
        title: 'Shared calendar',
        text: 'Site visits, meetings, deadlines - fully coordinated across all project participants in one unified calendar.',
        icon: CalendarDays,
      },
      {
        title: 'Structured project chat',
        text: 'Messages linked to docs, tasks, and milestones. No more endless email threads for each update.',
        icon: MessageCircle,
      },
      {
        title: 'Contextual access',
        text: 'Your professional profile can work across multiple projects with different roles. One account for everything.',
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
    finalCta: 'Start 30-Day Free Trial',
    finalNote: 'No credit card · 2-minute setup · Cancel anytime',
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
      <section className="pt-32 pb-20 text-center px-6 bg-[#fcfcfc]">
        <div className="max-w-3xl mx-auto">
          <span data-reveal className={`${PUBLIC_CLASSES.badge} mb-4`}>
            {copy.badge}
          </span>
          <h1 data-reveal className={`${PUBLIC_CLASSES.displayH1} text-[#141821]`}>
            {copy.title}
          </h1>
          <p data-reveal className={`mt-4 ${PUBLIC_CLASSES.bodyLead}`}>
            {copy.subtitle}
          </p>
          <PublicPrimaryCta className="mt-8" to={`${basePath}/contatti`} label={copy.ctaTop} />
        </div>
      </section>

      <section className="py-16 bg-[#f3f4f680] px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-bold text-2xl text-[#141821] mb-8 text-center">{copy.rolesTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {copy.roles.map((role) => (
              <article key={role.title} data-reveal className={`${PUBLIC_CLASSES.card} p-5`}>
                <h3 className={`${PUBLIC_CLASSES.sectionH3} mb-2`}>{role.title}</h3>
                <p className={PUBLIC_CLASSES.bodySm}>{role.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-[#fcfcfc]">
        <div className="max-w-7xl mx-auto">
          <h2 className={`${PUBLIC_CLASSES.sectionH2} text-center mb-12`}>{copy.featuresTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {copy.features.map((item) => {
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
        ctaHref={`${basePath}/contatti`}
        note={copy.finalNote}
      />
    </div>
  );
}
