import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { initializeI18n } from '@/components/i18n/i18nConfig';
import i18next from '@/components/i18n/i18nConfig';

// Initialize i18n on module load
initializeI18n();

export default function AppProvider({ children }) {
  return (
    <I18nextProvider i18n={i18next}>
      {children}
    </I18nextProvider>
  );
}