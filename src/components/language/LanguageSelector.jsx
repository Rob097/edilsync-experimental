import React from 'react';
import { useLanguage } from '@/components/i18n/useLanguage';
import { getAllLocaleConfigs } from '@/components/i18n/localeConfig';
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
  const localeOptions = getAllLocaleConfigs();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-gray-500" />
      <Select value={currentLanguage} onValueChange={changeLanguage}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder={t('languageSelector.placeholder')} />
        </SelectTrigger>
        <SelectContent>
          {localeOptions.map((locale) => (
            <SelectItem key={locale.code} value={locale.code}>{locale.nativeLabel}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}