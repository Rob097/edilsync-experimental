import React from 'react';
import { useLanguage } from '@/components/i18n/useLanguage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from 'lucide-react';

export default function LanguageSelector() {
  const { currentLanguage, changeLanguage, t } = useLanguage();
  const selectedLanguage = currentLanguage === 'en' ? 'en' : 'it';

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-gray-500" />
      <Select value={selectedLanguage} onValueChange={changeLanguage}>
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