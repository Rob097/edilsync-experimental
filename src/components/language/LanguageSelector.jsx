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
  const { currentLanguage, changeLanguage } = useLanguage();
  const selectedLanguage = currentLanguage === 'en' ? 'en' : 'it';

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-gray-500" />
      <Select value={selectedLanguage} onValueChange={changeLanguage}>
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Italiano" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="it">Italiano</SelectItem>
          <SelectItem value="en">English</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}