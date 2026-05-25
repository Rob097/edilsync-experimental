import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/components/i18n/useLanguage';
import { getAllLocaleConfigs } from '@/components/i18n/localeConfig';
import { detectPublicLocale, localizePublicPath } from '@/public/lib/localePath';

export default function PublicLanguageSelector() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const localeOptions = getAllLocaleConfigs();
  const selectedLanguage = detectPublicLocale(location.pathname);

  const onValueChange = (value) => {
    if (value === selectedLanguage) return;
    const nextPath = localizePublicPath(location.pathname, value);
    navigate(nextPath + location.search + location.hash);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-gray-500" />
      <label className="sr-only" htmlFor="public-language-selector">
        {t('languageSelector.placeholder')}
      </label>
      <select
        id="public-language-selector"
        className="h-9 w-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        value={selectedLanguage}
        onChange={(event) => onValueChange(event.target.value)}
      >
        {localeOptions.map((locale) => (
          <option key={locale.code} value={locale.code}>{locale.nativeLabel}</option>
        ))}
      </select>
    </div>
  );
}
