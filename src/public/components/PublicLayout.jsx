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
import publicLayoutIt from '@/public/i18n/layout.it.json';
import publicLayoutEn from '@/public/i18n/layout.en.json';

if (!i18next.isInitialized) {
  initializeI18n();
}

const audienceIconByKey = {
  hammer: Hammer,
  house: House,
  ruler: Ruler,
  wrench: Wrench,
};

const layoutByLocale = {
  it: publicLayoutIt,
  en: publicLayoutEn,
};

export default function PublicLayout({ locale = 'it', children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isEnglishPath = location.pathname.startsWith('/en');
  const effectiveLocale = isEnglishPath ? 'en' : locale;
  const localized = layoutByLocale[effectiveLocale] || layoutByLocale.it;
  const copy = localized.cta;
  const aria = localized.aria;

  const menu = useMemo(() => {
    const rawMenu = localized.menu;
    const audiences = {
      ...rawMenu.audiences,
      sections: rawMenu.audiences.sections.map((section) => ({
        ...section,
        links: section.links.map((link) => ({
          ...link,
          icon: link.icon ? audienceIconByKey[link.icon] : undefined,
        })),
      })),
    };

    return {
      ...rawMenu,
      audiences,
    };
  }, [localized]);

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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.search]);

  return (
    <I18nextProvider i18n={i18next}>
      <div className="public-site min-h-screen flex flex-col">
        <header className="sticky top-0 z-40 border-b border-[rgba(84,63,54,0.12)] bg-[rgba(247,241,235,0.84)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[rgba(247,241,235,0.74)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
            <Link to={effectiveLocale === 'en' ? '/en' : '/'} className="public-anchor-link flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[linear-gradient(135deg,#ef6144,#d9553a)] flex items-center justify-center shadow-[0_14px_28px_rgba(239,97,68,0.25)]">
                <HardHat className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="block font-semibold text-[1.05rem] leading-none">EdilSync</span>
                <span className="hidden md:block mt-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#7b665e]">
                  {localized.brandTagline}
                </span>
              </div>
            </Link>

            <div className="hidden lg:flex items-center gap-5">
              <NavigationMenu>
                <NavigationMenuList>
                  {topMenus.map((entry) => (
                    <NavigationMenuItem key={entry.key}>
                      <NavigationMenuTrigger className="rounded-full bg-transparent px-3.5 text-[13px] font-semibold text-[#4f443e] hover:bg-white/70 hover:text-[#1f1c1a] data-[state=open]:bg-white data-[state=open]:text-[#1f1c1a]">
                        {entry.label}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="w-[780px] rounded-[28px] border border-[rgba(84,63,54,0.14)] bg-[rgba(255,251,247,0.98)] p-6 shadow-[0_30px_80px_rgba(46,33,28,0.14)]">
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
                                            className="group block rounded-2xl border border-transparent p-3 transition hover:border-[rgba(239,97,68,0.16)] hover:bg-white"
                                          >
                                            <>
                                              <p className="text-[13px] font-semibold text-[#2a211f] group-hover:text-[#ef6144] inline-flex items-center gap-1.5 leading-tight">
                                                {item.icon ? <item.icon className="h-3.5 w-3.5 text-[#ef6144]" /> : null}
                                                {item.label}
                                              </p>
                                              <p className="mt-1 text-[11px] leading-[1.45] text-[#62524c]">{item.desc}</p>
                                            </>
                                          </Link>
                                        </NavigationMenuLink>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>

                            <div className="rounded-[24px] border border-[rgba(239,97,68,0.18)] bg-[linear-gradient(180deg,#fff8f5,#fffdfb)] text-[#2a211f] self-start h-fit p-5">
                              <entry.icon className="h-[18px] w-[18px] text-[#ef6144]" />
                              <p className="mt-2.5 text-[17px] leading-tight font-semibold">{entry.featured.title}</p>
                              <p className="mt-1.5 text-[12px] leading-[1.6] text-[#5e4d47]">{entry.featured.text}</p>
                              <Link
                                to={effectiveLocale === 'en' ? '/en/contatti' : '/contatti'}
                                className="inline-flex items-center gap-1 font-semibold text-[#c55039] mt-4 text-[12px]"
                              >
                                {copy.demo}
                                <ChevronRight className="h-3.5 w-3.5" />
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
                <Link key={item.href} to={item.href} className="public-nav-link text-[13px] font-semibold">
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
                className="public-outline-button lg:hidden rounded-full"
                onClick={() => setMobileOpen((prev) => !prev)}
                aria-label={mobileOpen ? aria.closeMenu : aria.openMenu}
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
              <Button asChild variant="outline" className="public-outline-button hidden lg:inline-flex rounded-full px-5">
                <Link to="/app">{copy.login}</Link>
              </Button>
              <Button asChild className="public-primary-button hidden lg:inline-flex rounded-full px-5">
                <Link to={effectiveLocale === 'en' ? '/en/contatti' : '/contatti'}>{copy.demo}</Link>
              </Button>
            </div>
          </div>

          {mobileOpen ? (
            <div className="lg:hidden border-t border-[rgba(84,63,54,0.12)] bg-[rgba(255,250,246,0.98)]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-3">
                <div className="sm:hidden pb-1">
                  <PublicLanguageSelector />
                </div>

                {topMenus.map((entry) => (
                  <details key={entry.key} className="group rounded-[24px] border border-[rgba(84,63,54,0.12)] bg-[rgba(255,255,255,0.84)] open:bg-white open:shadow-[0_18px_42px_rgba(46,33,28,0.08)]">
                    <summary className="list-none cursor-pointer px-3 py-2.5 flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#261d1a]">{entry.label}</span>
                      <ChevronRight className="h-4 w-4 text-[#8b6f67] transition-transform group-open:rotate-90" />
                    </summary>

                    <div className="px-3 pb-3 space-y-3">
                      {entry.sections.map((section, sectionIndex) => (
                        <div key={`${entry.key}-mobile-${sectionIndex}`}>
                          {section.title ? <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8f7a74]">{section.title}</p> : null}
                          <div className="space-y-1.5">
                            {section.links.map((item) => (
                              <Link key={item.href} to={item.href} className="block rounded-2xl border border-[rgba(84,63,54,0.1)] px-3 py-2.5 bg-white">
                                <p className="text-[13px] font-semibold text-[#2a211f] inline-flex items-center gap-2 leading-tight">
                                  {item.icon ? <item.icon className="h-3.5 w-3.5 text-[#ef6144]" /> : null}
                                  {item.label}
                                </p>
                                <p className="text-[11px] text-[#65544f] mt-1 leading-[1.45]">{item.desc}</p>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                ))}

                <div className="pt-2 border-t border-[rgba(84,63,54,0.12)] space-y-2">
                  {menu.quickLinks.map((item) => (
                    <Link key={item.href} to={item.href} className="block rounded-2xl border border-[rgba(84,63,54,0.1)] px-3 py-2.5 text-[13px] font-semibold text-[#2a211f] bg-white">
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="pt-1 space-y-2">
                  <Button asChild variant="outline" className="public-outline-button w-full rounded-full">
                    <Link to="/app">{copy.login}</Link>
                  </Button>
                  <Button asChild className="public-primary-button w-full rounded-full">
                    <Link to={effectiveLocale === 'en' ? '/en/contatti' : '/contatti'}>{copy.demo}</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </header>

        <main className="flex-1">{children}</main>
        <div className="public-footer-wrap">
          <Footer />
        </div>
        <CookieBanner />
      </div>
    </I18nextProvider>
  );
}
