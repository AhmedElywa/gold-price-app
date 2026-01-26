'use client';

import { Mail, MapPin, Phone, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-8 h-8 text-amber-500" />
              <h3 className="text-2xl font-bold">{t('app.brand')}</h3>
            </div>
            <p className="text-gray-300 mb-4">{t('footer.description')}</p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-300 hover:text-amber-500 transition-colors">
                {t('footer.privacyPolicy')}
              </a>
              <a href="#" className="text-gray-300 hover:text-amber-500 transition-colors">
                {t('footer.termsOfService')}
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              <li>
                <a href="#gold" className="text-gray-300 hover:text-amber-500 transition-colors">
                  {t('navigation.goldPrices')}
                </a>
              </li>
              <li>
                <a href="#silver" className="text-gray-300 hover:text-amber-500 transition-colors">
                  {t('navigation.silverPrices')}
                </a>
              </li>
              <li>
                <a href="#exchange" className="text-gray-300 hover:text-amber-500 transition-colors">
                  {t('navigation.exchangeRates')}
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-amber-500 transition-colors">
                  {t('footer.historicalData')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">{t('footer.contactInfo')}</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500" />
                <span className="text-gray-300">{t('footer.email')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500" />
                <span className="text-gray-300">{t('footer.phone')}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span className="text-gray-300">{t('footer.location')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-300">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  );
}
