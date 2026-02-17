import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <p>© {currentYear} EdilSync. Tutti i diritti riservati.</p>
          <nav className="flex items-center gap-4">
            <Link to={createPageUrl('PrivacyPolicy')} className="hover:text-gray-700 transition-colors">
              Privacy Policy
            </Link>
            <Link to={createPageUrl('TermsOfService')} className="hover:text-gray-700 transition-colors">
              Termini di Servizio
            </Link>
            <Link to={createPageUrl('CookiePolicy')} className="hover:text-gray-700 transition-colors">
              Cookie Policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}