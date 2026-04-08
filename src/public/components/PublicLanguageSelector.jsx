import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/components/i18n/useLanguage';

function toEnglishPath(pathname) {
  if (pathname.startsWith('/en')) return pathname;
  if (pathname === '/') return '/en';
  return `/en${pathname}`;
}

function toItalianPath(pathname) {
  if (!pathname.startsWith('/en')) return pathname;
  const stripped = pathname.replace(/^\/en/, '');
  return stripped || '/';
}

export default function PublicLanguageSelector() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const selectedLanguage = location.pathname.startsWith('/en') ? 'en' : 'it';

  const onValueChange = (value) => {
    if (value === selectedLanguage) return;
    const nextPath = value === 'en' ? toEnglishPath(location.pathname) : toItalianPath(location.pathname);
    navigate(nextPath + location.search + location.hash);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-gray-500" />
      <Select value={selectedLanguage} onValueChange={onValueChange}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder={t('languageSelector.placeholder')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="it">{t('languageSelector.italian')}</SelectItem>
          <SelectItem value="en">{t('languageSelector.english')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
