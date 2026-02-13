'use client';

import { Menu, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import { CurrencySelector } from './currency-selector';
import { LanguageSelector } from './language-selector';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './ui/sheet';

export function Header() {
  const { t, locale } = useTranslation();

  const navLinks = (
    <>
      <a href="#gold" className="text-[#8A8A8E] hover:text-[#D4AF37] transition-colors">
        {t('navigation.goldPrices')}
      </a>
      <a href="#silver" className="text-[#8A8A8E] hover:text-[#D4AF37] transition-colors">
        {t('navigation.silverPrices')}
      </a>
      <a href="#exchange" className="text-[#8A8A8E] hover:text-[#D4AF37] transition-colors">
        {t('navigation.exchangeRates')}
      </a>
      <Link href={`/${locale}/about`} className="text-[#8A8A8E] hover:text-[#D4AF37] transition-colors">
        {t('navigation.about')}
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-[#0A0A0F]/80 backdrop-blur-xl border-b border-[rgba(212,175,55,0.15)]">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8 text-[#D4AF37]" />
            <h1 className="text-2xl font-bold font-serif gold-gradient-text">{t('app.brand')}</h1>
          </div>

          <nav className="hidden lg:flex items-center gap-6">{navLinks}</nav>

          <div className="hidden lg:flex items-center gap-3">
            <LanguageSelector />
            <CurrencySelector />
          </div>

          {/* Mobile/tablet hamburger */}
          <Sheet>
            <SheetTrigger className="lg:hidden p-2 text-[#8A8A8E] hover:text-[#D4AF37] transition-colors">
              <Menu className="w-6 h-6" />
            </SheetTrigger>
            <SheetContent side="right" className="bg-[#0A0A0F] border-l border-[rgba(212,175,55,0.15)] w-72">
              <SheetTitle className="font-serif gold-gradient-text text-lg">{t('app.brand')}</SheetTitle>
              <nav className="flex flex-col gap-4 mt-6">{navLinks}</nav>
              <div className="flex flex-col gap-3 mt-8">
                <LanguageSelector />
                <CurrencySelector />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
