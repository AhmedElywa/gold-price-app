'use client';

import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { CurrencySelector } from './currency-selector';
import { LanguageSelector } from './language-selector';

export function Header() {
  const { t, locale } = useTranslation();

  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-[rgba(212,175,55,0.15)]">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-[#D4AF37]" />
            <h1 className="text-2xl font-bold font-serif gold-gradient-text">{t('app.brand')}</h1>
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            <Link href={`/${locale}#gold`} className="text-[#8A8A8E] hover:text-[#D4AF37] transition-colors">
              {t('navigation.goldPrices')}
            </Link>
            <Link href={`/${locale}#silver`} className="text-[#8A8A8E] hover:text-[#D4AF37] transition-colors">
              {t('navigation.silverPrices')}
            </Link>
            <Link href={`/${locale}#exchange`} className="text-[#8A8A8E] hover:text-[#D4AF37] transition-colors">
              {t('navigation.exchangeRates')}
            </Link>
            <Link href={`/${locale}/about`} className="text-[#8A8A8E] hover:text-[#D4AF37] transition-colors">
              {t('navigation.about')}
            </Link>
          </nav>

          <div className="flex items-center gap-2 lg:gap-3">
            <LanguageSelector />
            <CurrencySelector />
          </div>
        </div>
      </div>
    </header>
  );
}
