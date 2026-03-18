import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/components/i18n/useLanguage';

export default function Footer() {
  const { currentLanguage, t } = useLanguage();
  const tr = (itText, enText) => currentLanguage === 'it' ? itText : enText;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>{tr(`© ${currentYear} EdilSync. Tutti i diritti riservati.`, `© ${currentYear} EdilSync. All rights reserved.`)}</p>
          <nav className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-gray-700 transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link to="/termini" className="hover:text-gray-700 transition-colors">
              {t('footer.terms')}
            </Link>
            <Link to="/cookie" className="hover:text-gray-700 transition-colors">
              {t('footer.cookies')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}