'use client';

import { Activity, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoldData } from '@/hooks/useGoldData';
import { useSelectedCurrency } from '@/hooks/useSelectedCurrency';
import { useTranslation } from '@/hooks/useTranslation';
import { formatPrice, getPriceInSelectedCurrency } from '@/lib/price-utils';
import type { ApiResponseData } from '@/types/api';

export function SilverPrices({ initialData }: { initialData?: ApiResponseData | null }) {
  const { t, locale } = useTranslation();
  const selectedCurrency = useSelectedCurrency();
  const { data, loading, error } = useGoldData(initialData);

  if (loading) {
    return (
      <section id="silver" className="py-12">
        <div className="container mx-auto px-4">
          <Card className="glass-card shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 text-[#8A8A8E]">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('silver.loading')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section id="silver" className="py-12">
        <div className="container mx-auto px-4">
          <Card className="glass-card shadow-2xl">
            <CardContent className="p-6">
              <div className="text-center text-[#8A8A8E]">{t('silver.error')}</div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  const marketData = data.source_data.market_data;
  const silverPriceUSD = marketData.silver_price ?? 0;
  const silverChange = marketData.silver_change ?? 0;
  const silverChangePercent = marketData.silver_change_percent ?? 0;

  // Convert silver price to selected currency
  const silverPrice = getPriceInSelectedCurrency(silverPriceUSD, data.source_data.exchange_rates, selectedCurrency);
  const silverChangeConverted = getPriceInSelectedCurrency(
    silverChange,
    data.source_data.exchange_rates,
    selectedCurrency,
  );

  const isSilverPositive = silverChange >= 0;

  // Calculate gold to silver ratio (always in USD for consistency)
  const goldToSilverRatio = silverPriceUSD > 0 ? (marketData.current_price ?? 0) / silverPriceUSD : 0;

  // Generate different silver product prices based on spot price in selected currency
  const silverProducts = [
    {
      type: t('silver.products.spot'),
      price: formatPrice(silverPrice, selectedCurrency, locale),
      change: `${isSilverPositive ? '+' : ''}${silverChangeConverted.toFixed(2)}`,
      percentage: `(${silverChangePercent.toFixed(2)}%)`,
      trend: isSilverPositive ? 'up' : 'down',
    },
    {
      type: t('silver.products.coins'),
      price: formatPrice(silverPrice * 1.075, selectedCurrency, locale),
      change: `${isSilverPositive ? '+' : ''}${(silverChangeConverted * 1.075).toFixed(2)}`,
      percentage: `(${silverChangePercent.toFixed(2)}%)`,
      trend: isSilverPositive ? 'up' : 'down',
    },
    {
      type: t('silver.products.bars'),
      price: formatPrice(silverPrice * 1.007, selectedCurrency, locale),
      change: `${isSilverPositive ? '+' : ''}${(silverChangeConverted * 1.007).toFixed(2)}`,
      percentage: `(${silverChangePercent.toFixed(2)}%)`,
      trend: isSilverPositive ? 'up' : 'down',
    },
    {
      type: t('silver.products.jewelry'),
      price: formatPrice(silverPrice * 1.175, selectedCurrency, locale),
      change: `${isSilverPositive ? '+' : ''}${(silverChangeConverted * 1.175).toFixed(2)}`,
      percentage: `(${silverChangePercent.toFixed(2)}%)`,
      trend: isSilverPositive ? 'up' : 'down',
    },
  ];

  return (
    <section id="silver" className="py-12">
      <div className="container mx-auto px-4">
        <Card className="glass-card shadow-2xl">
          <CardHeader className="border-b border-[rgba(212,175,55,0.15)]">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-2xl font-bold font-serif gold-gradient-text mb-2">
                  {t('silver.title')}
                </CardTitle>
                <p className="text-[#8A8A8E]">{t('silver.subtitle')}</p>
              </div>

              <div className="flex items-center gap-4 mt-4 lg:mt-0">
                <div className="bg-[#1A1A2E] border border-[rgba(212,175,55,0.1)] rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-sm font-medium text-[#E8E6E3]">{t('silver.marketActive')}</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#8A8A8E] uppercase">{t('common.live')}</p>
                  <p className="text-sm font-semibold font-mono text-[#D4AF37]">{selectedCurrency}</p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {silverProducts.map((item, index) => (
                <div key={index} className="glass-card p-4 hover:scale-[1.02] transition-transform">
                  <div className="text-center">
                    <h3 className="font-semibold text-[#E8E6E3] mb-2">{item.type}</h3>
                    <div className="text-2xl font-bold font-mono text-[#D4AF37] mb-1">{item.price}</div>
                    <div
                      className={`flex items-center justify-center gap-1 ${
                        item.trend === 'up' ? 'text-[#22C55E]' : 'text-[#EF4444]'
                      }`}
                    >
                      {item.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="text-sm font-medium font-mono">
                        {item.change} {item.percentage}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#1A1A2E] border border-[rgba(212,175,55,0.1)] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-[#E8E6E3]">{t('silver.goldSilverRatio')}</h4>
                  <p className="text-sm text-[#8A8A8E]">
                    {t('silver.currentRatio')} 1:{goldToSilverRatio.toFixed(2)}{' '}
                    {t('silver.goldExpensive', {
                      ratio: goldToSilverRatio.toFixed(0),
                    })}
                  </p>
                </div>
                <div className="text-end">
                  <div className="text-lg font-bold font-mono text-[#D4AF37]">{goldToSilverRatio.toFixed(2)}</div>
                  <div className={`text-sm font-mono ${isSilverPositive ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {silverChangePercent > 0 ? '+' : ''}
                    {silverChangePercent.toFixed(1)}% {t('common.today')}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
