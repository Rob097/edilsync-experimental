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
import '@/public/public-site.css';

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
                                            className="group block rounded-xl transition p-1.5 hover:bg-[#f7f2f0]"
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

                            <div className="rounded-xl border border-[#edd0c8] bg-[#fdf7f5] text-[#2a211f] self-start h-fit p-[18px]">
                              <entry.icon className="h-[18px] w-[18px] text-[#ef6144]" />
                              <p className="mt-2.5 text-[17px] leading-tight font-semibold">{entry.featured.title}</p>
                              <p className="mt-1.5 text-[12px] leading-[1.5] text-[#5e4d47]">{entry.featured.text}</p>
                              <Link
                                to={effectiveLocale === 'en' ? '/en/contatti' : '/contatti'}
                                className="inline-flex items-center gap-1 font-semibold text-[#c55039] mt-3 text-[12px]"
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
                aria-label={mobileOpen ? aria.closeMenu : aria.openMenu}
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>
              <Button asChild variant="outline" className="hidden lg:inline-flex border-[#d8c4be]">
                <Link to="/app">{copy.login}</Link>
              </Button>
              <Button asChild className="hidden lg:inline-flex bg-[#ef6144] hover:bg-[#d9553a] text-white">
                <Link to={effectiveLocale === 'en' ? '/en/contatti' : '/contatti'}>{copy.demo}</Link>
              </Button>
            </div>
          </div>

          {mobileOpen ? (
            <div className="lg:hidden border-t border-[#e6d7d2] bg-white">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-3">
                <div className="sm:hidden pb-1">
                  <PublicLanguageSelector />
                </div>

                {topMenus.map((entry) => (
                  <details key={entry.key} className="group rounded-xl border border-[#eaded9] bg-[#fcf9f8] open:bg-white open:shadow-sm">
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
                              <Link key={item.href} to={item.href} className="block rounded-lg border border-[#e8dbd7] px-3 py-2 bg-white">
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

                <div className="pt-2 border-t border-[#eaded9] space-y-2">
                  {menu.quickLinks.map((item) => (
                    <Link key={item.href} to={item.href} className="block rounded-lg border border-[#e8dbd7] px-3 py-2 text-[13px] font-semibold text-[#2a211f] bg-white">
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="pt-1 space-y-2">
                  <Button asChild variant="outline" className="w-full border-[#d8c4be]">
                    <Link to="/app">{copy.login}</Link>
                  </Button>
                  <Button asChild className="w-full bg-[#ef6144] hover:bg-[#d9553a] text-white">
                    <Link to={effectiveLocale === 'en' ? '/en/contatti' : '/contatti'}>{copy.demo}</Link>
                  </Button>
                </div>
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
