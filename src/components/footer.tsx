'use client';

import { Mail, MapPin, Phone, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

export function Footer() {
  const { t, locale } = useTranslation();

  return (
    <footer className="hidden lg:block bg-[#0A0A0F] border-t border-[rgba(212,175,55,0.15)]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-8 h-8 text-[#D4AF37]" />
              <h3 className="text-2xl font-bold font-serif gold-gradient-text">{t('app.brand')}</h3>
            </div>
            <p className="text-[#8A8A8E] mb-4">{t('footer.description')}</p>
            <div className="flex gap-4">
              <Link href={`/${locale}/privacy`} className="text-[#8A8A8E] hover:text-[#D4AF37] transition-colors">
                {t('footer.privacyPolicy')}
              </Link>
              <Link href={`/${locale}/terms`} className="text-[#8A8A8E] hover:text-[#D4AF37] transition-colors">
                {t('footer.termsOfService')}
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-[#E8E6E3] mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              <li>
                <a href="#gold" className="text-[#8A8A8E] hover:text-[#D4AF37] transition-colors">
                  {t('navigation.goldPrices')}
                </a>
              </li>
              <li>
                <a href="#silver" className="text-[#8A8A8E] hover:text-[#D4AF37] transition-colors">
                  {t('navigation.silverPrices')}
                </a>
              </li>
              <li>
                <a href="#exchange" className="text-[#8A8A8E] hover:text-[#D4AF37] transition-colors">
                  {t('navigation.exchangeRates')}
                </a>
              </li>
              <li>
                <Link href={`/${locale}/historical`} className="text-[#8A8A8E] hover:text-[#D4AF37] transition-colors">
                  {t('footer.historicalData')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-[#E8E6E3] mb-4">{t('footer.contactInfo')}</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-[#8A8A8E]">{t('footer.email')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-[#8A8A8E]">{t('footer.phone')}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-[#8A8A8E]">{t('footer.location')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[rgba(212,175,55,0.15)] mt-8 pt-8 text-center">
          <p className="text-[#8A8A8E]">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
