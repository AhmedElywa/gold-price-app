'use client';

import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/useTranslation';
import { isValidLocale } from '@/lib/i18n';

export function LanguageSelector() {
  const { t, locale, changeLanguage } = useTranslation();

  const handleLanguageChange = (newLocale: string) => {
    if (isValidLocale(newLocale)) {
      changeLanguage(newLocale);
    }
  };

  return (
    <Select value={locale} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-32 bg-[#1A1A2E] border-[rgba(212,175,55,0.15)] text-[#E8E6E3]">
        <Globe className="w-4 h-4 me-2 text-[#D4AF37]" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ar">{t('languages.arabic')}</SelectItem>
        <SelectItem value="de">{t('languages.german')}</SelectItem>
        <SelectItem value="en">{t('languages.english')}</SelectItem>
        <SelectItem value="es">{t('languages.spanish')}</SelectItem>
        <SelectItem value="fr">{t('languages.french')}</SelectItem>
        <SelectItem value="hi">{t('languages.hindi')}</SelectItem>
        <SelectItem value="it">{t('languages.italian')}</SelectItem>
        <SelectItem value="ja">{t('languages.japanese')}</SelectItem>
        <SelectItem value="ms">{t('languages.malay')}</SelectItem>
        <SelectItem value="nl">{t('languages.dutch')}</SelectItem>
        <SelectItem value="rm">{t('languages.romansh')}</SelectItem>
        <SelectItem value="ru">{t('languages.russian')}</SelectItem>
        <SelectItem value="ta">{t('languages.tamil')}</SelectItem>
        <SelectItem value="tr">{t('languages.turkish')}</SelectItem>
        <SelectItem value="zh">{t('languages.chinese')}</SelectItem>
      </SelectContent>
    </Select>
  );
}
