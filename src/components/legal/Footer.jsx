import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '@/components/i18n/useLanguage';
import { localizePublicPath } from '@/public/lib/localePath';

export default function Footer() {
  const { currentLanguage, t } = useLanguage();
  const location = useLocation();
  const tr = (itText, enText) => currentLanguage === 'it' ? itText : enText;
  const currentYear = new Date().getFullYear();
  const privacyPath = localizePublicPath('/privacy', location.pathname);
  const termsPath = localizePublicPath('/termini', location.pathname);
  const cookiePath = localizePublicPath('/cookie', location.pathname);

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>{tr(`© ${currentYear} EdilSync. Tutti i diritti riservati.`, `© ${currentYear} EdilSync. All rights reserved.`)}</p>
          <nav className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            <Link to={privacyPath} className="inline-flex min-h-11 items-center rounded-full px-3 hover:text-gray-700 transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link to={termsPath} className="inline-flex min-h-11 items-center rounded-full px-3 hover:text-gray-700 transition-colors">
              {t('footer.terms')}
            </Link>
            <Link to={cookiePath} className="inline-flex min-h-11 items-center rounded-full px-3 hover:text-gray-700 transition-colors">
              {t('footer.cookies')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}