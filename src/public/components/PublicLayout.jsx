import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, ChevronRight, HardHat, Hammer, House, Menu, Ruler, ShieldCheck, Users2, Wrench, X } from 'lucide-react';
import { I18nextProvider } from 'react-i18next';
import i18next, { initializeI18n } from '@/components/i18n/i18nConfig';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import CookieBanner from '@/components/legal/CookieBanner';
import Footer from '@/components/legal/Footer';
import PublicLanguageSelector from '@/public/components/PublicLanguageSelector';
import '@/public/public-site.css';

if (!i18next.isInitialized) {
  initializeI18n();
}

const menuByLocale = {
  it: {
    solutions: {
      label: 'Soluzione',
      sections: [
        {
          title: 'Panoramica prodotto',
          links: [
            { label: 'Funzionalita complete', href: '/funzionalita', desc: 'Task, documenti, dispute, finanza e chat in un unico flusso.' },
            { label: 'Come funziona', href: '/come-funziona', desc: 'Dal kickoff del cantiere alla chiusura con evidenze tracciate.' },
            { label: 'Prezzi', href: '/prezzi', desc: 'Onboarding guidato con percorso su misura per il team.' },
          ],
        },
        {
          title: 'Punti critici che risolve',
          links: [
            { label: 'Protezione dispute', href: '/contractors', desc: 'Riduci margine bruciato da extra non formalizzati.' },
            { label: 'Trasparenza committente', href: '/per-committenti', desc: 'Meno ansia e meno aggiornamenti dispersi su chat.' },
            { label: 'Coordinamento squadra', href: '/per-subappaltatori', desc: 'Meno viaggi a vuoto e responsabilita piu chiare.' },
          ],
        },
      ],
      featured: {
        title: 'Perche EdilSync',
        text: 'La piattaforma e costruita per proteggere impresa, margine e reputazione con una cronologia che regge quando nascono contestazioni.',
      },
    },
    audiences: {
      label: 'Per chi è',
      sections: [
        {
          title: '',
          links: [
            { label: 'Contractor', href: '/contractors', desc: 'Imprese generali e specializzate', icon: Hammer },
            { label: 'Committenti', href: '/per-committenti', desc: 'Proprietari e committenti privati', icon: House },
          ],
        },
        {
          title: '',
          links: [
            { label: 'Professionisti Tecnici', href: '/per-tecnici', desc: 'Architetti, ingegneri, geometri, designer', icon: Ruler },
            { label: 'Subappaltatori', href: '/per-subappaltatori', desc: 'Artigiani e specialisti in subappalto', icon: Wrench },
          ],
        },
      ],
      featured: {
        title: 'Modello contestuale',
        text: 'Una persona puo agire come privato, impresa o tecnico senza duplicare account e dati: cambiano azioni e permessi, non il caos.',
      },
    },
    resources: {
      label: 'Risorse',
      sections: [
        {
          title: 'Approfondimenti',
          links: [
            { label: 'Blog EdilSync', href: '/blog', desc: 'Guide pratiche su dispute, coordinamento e operativita.' },
            { label: 'FAQ', href: '/faq', desc: 'Risposte rapide su adozione, onboarding e utilizzo sul campo.' },
            { label: 'Contatti', href: '/contatti', desc: 'Parla con il team per una demo orientata al tuo cantiere.' },
          ],
        },
      ],
      featured: {
        title: 'Approccio pratico',
        text: 'Meno teoria, piu casi reali: ogni contenuto spiega come ridurre ritardi, rilavorazioni e attriti tra gli attori di progetto.',
      },
    },
    quickLinks: [
      { label: 'Blog', href: '/blog' },
      { label: 'Contatti', href: '/contatti' },
    ],
  },
  en: {
    solutions: {
      label: 'Solution',
      sections: [
        {
          title: 'Product overview',
          links: [
            { label: 'Full feature set', href: '/en/funzionalita', desc: 'Tasks, documents, disputes, finance, and chat in one flow.' },
            { label: 'How it works', href: '/en/come-funziona', desc: 'From project kickoff to closeout with traceable evidence.' },
            { label: 'Pricing', href: '/en/prezzi', desc: 'Guided onboarding aligned with your team and project volume.' },
          ],
        },
        {
          title: 'Core pain points solved',
          links: [
            { label: 'Dispute protection', href: '/en/contractors', desc: 'Protect margin from untracked scope changes.' },
            { label: 'Client transparency', href: '/en/per-committenti', desc: 'Reduce anxiety and status-chasing across channels.' },
            { label: 'Crew coordination', href: '/en/per-subappaltatori', desc: 'Cut wasted trips with clearer accountability.' },
          ],
        },
      ],
      featured: {
        title: 'Why EdilSync',
        text: 'Built to protect contractor margin and reputation through a defensible, project-native timeline when disputes happen.',
      },
    },
    audiences: {
      label: "Who it's for",
      sections: [
        {
          title: '',
          links: [
            { label: 'Contractors', href: '/en/contractors', desc: 'General and specialized construction companies', icon: Hammer },
            { label: 'Owners', href: '/en/per-committenti', desc: 'Private owners and clients', icon: House },
          ],
        },
        {
          title: '',
          links: [
            { label: 'Technical professionals', href: '/en/per-tecnici', desc: 'Architects, engineers, surveyors, designers', icon: Ruler },
            { label: 'Subcontractors', href: '/en/per-subappaltatori', desc: 'Specialist trades and external crews', icon: Wrench },
          ],
        },
      ],
      featured: {
        title: 'Context-aware permissions',
        text: 'A person can act as homeowner, contractor, or technical role over time without splitting accounts or losing data continuity.',
      },
    },
    resources: {
      label: 'Resources',
      sections: [
        {
          title: 'Learn and evaluate',
          links: [
            { label: 'EdilSync blog', href: '/en/blog', desc: 'Field-tested content on disputes, workflows, and team alignment.' },
            { label: 'FAQ', href: '/en/faq', desc: 'Answers on rollout, onboarding, and operational adoption.' },
            { label: 'Contact', href: '/en/contatti', desc: 'Book a demo focused on your exact operating model.' },
          ],
        },
      ],
      featured: {
        title: 'Practical guidance',
        text: 'Content is built around real jobsite constraints, not generic project management theory.',
      },
    },
    quickLinks: [
      { label: 'Blog', href: '/en/blog' },
      { label: 'Contact', href: '/en/contatti' },
    ],
  },
};

const ctaByLocale = {
  it: {
    demo: 'Richiedi una demo',
    login: 'Accedi',
  },
  en: {
    demo: 'Request a demo',
    login: 'Log in',
  },
};

export default function PublicLayout({ locale = 'it', children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isEnglishPath = location.pathname.startsWith('/en');
  const effectiveLocale = isEnglishPath ? 'en' : locale;
  const menu = menuByLocale[effectiveLocale] || menuByLocale.it;
  const copy = ctaByLocale[effectiveLocale] || ctaByLocale.it;

  const topMenus = useMemo(
    () => [
      { key: 'solutions', icon: ShieldCheck, ...menu.solutions },
      { key: 'audiences', icon: Users2, ...menu.audiences },
      { key: 'resources', icon: Building2, ...menu.resources },
    ],
    [menu],
  );

  useEffect(() => {
    if (i18next.language !== effectiveLocale) {
      i18next.changeLanguage(effectiveLocale);
    }
  }, [effectiveLocale]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <I18nextProvider i18n={i18next}>
      <div className="public-site min-h-screen bg-[#f8f5f3] text-slate-900 flex flex-col">
        <header className="sticky top-0 z-40 border-b border-white/60 bg-white/75 backdrop-blur-xl shadow-sm shadow-slate-200/40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <Link to={effectiveLocale === 'en' ? '/en' : '/'} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-[#ef6144] flex items-center justify-center">
                <HardHat className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold text-xl">EdilSync</span>
            </Link>

            <div className="hidden lg:flex items-center gap-4">
              <NavigationMenu>
                <NavigationMenuList>
                  {topMenus.map((entry) => (
                    <NavigationMenuItem key={entry.key}>
                      <NavigationMenuTrigger className="bg-transparent hover:bg-white/80 data-[state=open]:bg-white text-[#4a3d39]">
                        {entry.label}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="w-[760px] rounded-2xl border border-[#e6d7d2] bg-white p-6 shadow-xl">
                          <div className="grid grid-cols-3 gap-4">
                            <div className={`col-span-2 grid gap-4 ${entry.sections.length > 1 ? 'sm:grid-cols-2' : 'sm:grid-cols-1'}`}>
                              {entry.sections.map((section, sectionIndex) => (
                                <div key={`${entry.key}-${sectionIndex}`} className="p-1">
                                  {section.title ? <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8f7a74]">{section.title}</p> : null}
                                  <ul className={section.title ? 'mt-3 space-y-3' : 'space-y-3'}>
                                    {section.links.map((item) => (
                                      <li key={item.href}>
                                        <NavigationMenuLink asChild>
                                          <Link
                                            to={item.href}
                                            className={`group block rounded-xl transition ${entry.key === 'audiences' ? 'p-2.5 hover:bg-[#f9f3f1]' : 'p-1.5 hover:bg-[#f7f2f0]'}`}
                                          >
                                            {entry.key === 'audiences' ? (
                                              <div className="flex items-start gap-2.5">
                                                {item.icon ? (
                                                  <div className="w-9 h-9 rounded-xl bg-[#f9ebe6] flex items-center justify-center shrink-0">
                                                    <item.icon className="h-4 w-4 text-[#ef6144]" />
                                                  </div>
                                                ) : null}
                                                <div>
                                                  <p className="text-[15px] leading-tight font-bold text-[#2a211f]">{item.label}</p>
                                                  <p className="mt-1 text-[12px] leading-[1.35] text-[#667085]">{item.desc}</p>
                                                </div>
                                              </div>
                                            ) : (
                                              <>
                                                <p className="text-[13px] font-semibold text-[#2a211f] group-hover:text-[#ef6144] inline-flex items-center gap-1.5 leading-tight">
                                                  {item.icon ? <item.icon className="h-3.5 w-3.5 text-[#ef6144]" /> : null}
                                                  {item.label}
                                                </p>
                                                <p className="mt-1 text-[11px] leading-[1.45] text-[#62524c]">{item.desc}</p>
                                              </>
                                            )}
                                          </Link>
                                        </NavigationMenuLink>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>

                            <div className={`rounded-xl border border-[#edd0c8] bg-[#fdf7f5] text-[#2a211f] self-start h-fit ${entry.key === 'audiences' ? 'p-4' : 'p-[18px]'}`}>
                              <entry.icon className={`${entry.key === 'audiences' ? 'h-4 w-4' : 'h-[18px] w-[18px]'} text-[#ef6144]`} />
                              <p className={`font-semibold ${entry.key === 'audiences' ? 'mt-2 text-base' : 'mt-2.5 text-[17px] leading-tight'}`}>{entry.featured.title}</p>
                              <p className={`${entry.key === 'audiences' ? 'mt-1.5 text-xs leading-[1.45]' : 'mt-1.5 text-[12px] leading-[1.5]'} text-[#5e4d47]`}>{entry.featured.text}</p>
                              <Link
                                to={effectiveLocale === 'en' ? '/en/contatti' : '/contatti'}
                                className={`inline-flex items-center gap-1 font-semibold text-[#c55039] ${entry.key === 'audiences' ? 'mt-3 text-xs' : 'mt-3 text-[12px]'}`}
                              >
                                {copy.demo}
                                <ChevronRight className={`${entry.key === 'audiences' ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>

              {menu.quickLinks.map((item) => (
                <Link key={item.href} to={item.href} className="text-sm text-[#4a3d39] hover:text-[#231b19] transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:block">
                <PublicLanguageSelector />
              </div>
              <Button
                type="button"
                variant="outline"
                className="lg:hidden border-[#d8c4be]"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
              <Button asChild variant="outline" className="border-[#d8c4be]">
                <Link to="/app">{copy.login}</Link>
              </Button>
              <Button asChild className="bg-[#ef6144] hover:bg-[#d9553a] text-white">
                <Link to={effectiveLocale === 'en' ? '/en/contatti' : '/contatti'}>{copy.demo}</Link>
              </Button>
            </div>
          </div>

          {mobileOpen ? (
            <div className="lg:hidden border-t border-[#e6d7d2] bg-white">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-5">
                {topMenus.map((entry) => (
                  <div key={entry.key}>
                    <p className="text-sm font-semibold text-[#261d1a]">{entry.label}</p>
                    <div className="mt-2 space-y-2">
                      {entry.sections.flatMap((section) => section.links).map((item) => (
                        <Link key={item.href} to={item.href} className="block rounded-lg border border-[#e8dbd7] px-3 py-2">
                          <p className="text-sm font-semibold text-[#2a211f] inline-flex items-center gap-2">
                            {item.icon ? <item.icon className="h-4 w-4 text-[#ef6144]" /> : null}
                            {item.label}
                          </p>
                          <p className="text-xs text-[#65544f] mt-1">{item.desc}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </header>

        <main className="flex-1">{children}</main>
        <Footer />
        <CookieBanner />
      </div>
    </I18nextProvider>
  );
}
