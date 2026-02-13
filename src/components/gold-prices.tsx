'use client';

import { AlertCircle, Loader2, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CurrencySelector } from '@/components/currency-selector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoldData } from '@/hooks/useGoldData';
import { useSelectedCurrency } from '@/hooks/useSelectedCurrency';
import { useTranslation } from '@/hooks/useTranslation';
import { formatPrice, getPriceInSelectedCurrency } from '@/lib/price-utils';
import type { ApiResponseData } from '@/types/api';

export function GoldPrices({ initialData }: { initialData?: ApiResponseData | null }) {
  const { t, locale } = useTranslation();
  const selectedCurrency = useSelectedCurrency();
  const { data, loading, error, lastUpdated, refresh } = useGoldData(initialData);
  const [priceFlash, setPriceFlash] = useState(false);
  const prevDataRef = useRef<string | null>(null);

  // Detect data changes for gold flash animation
  useEffect(() => {
    if (data) {
      const dataKey = JSON.stringify(data.source_data.market_data?.current_price);
      if (prevDataRef.current !== null && prevDataRef.current !== dataKey) {
        setPriceFlash(true);
        const timer = setTimeout(() => setPriceFlash(false), 800);
        return () => clearTimeout(timer);
      }
      prevDataRef.current = dataKey;
    }
  }, [data]);

  if (error) {
    return (
      <section id="gold" className="py-12">
        <div className="container mx-auto px-4">
          <Card className="glass-card shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 text-[#EF4444]">
                <AlertCircle className="w-5 h-5" />
                <span>
                  {t('gold.error')} {error}
                </span>
                <Button
                  onClick={refresh}
                  variant="outline"
                  size="sm"
                  className="border-[rgba(212,175,55,0.15)] text-[#E8E6E3] hover:bg-[#1A1A2E]"
                >
                  {t('common.retry')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  // Determine which prices to display based on selected currency
  const getDisplayPrice = (karat: '24k' | '22k' | '21k' | '20k' | '18k' | '16k' | '14k' | '10k') => {
    if (selectedCurrency === 'EGP' && data?.gold_prices_egp_per_gram) {
      return data.gold_prices_egp_per_gram[karat];
    }
    if (data?.source_data.gold_price_usd_per_gram) {
      const usdPrice = data.source_data.gold_price_usd_per_gram[karat] ?? 0;
      return getPriceInSelectedCurrency(usdPrice, data.source_data.exchange_rates, selectedCurrency);
    }
    return 0;
  };

  const goldPricesDisplay =
    selectedCurrency === 'EGP' ? data?.gold_prices_egp_per_gram : data?.source_data.gold_price_usd_per_gram;

  const goldData = goldPricesDisplay
    ? [
        { karat: '24k', name: t('gold.karats.24k'), price: getDisplayPrice('24k'), highlight: true },
        { karat: '22k', name: t('gold.karats.22k'), price: getDisplayPrice('22k'), highlight: false },
        { karat: '21k', name: t('gold.karats.21k'), price: getDisplayPrice('21k'), highlight: true },
        { karat: '20k', name: t('gold.karats.20k'), price: getDisplayPrice('20k'), highlight: false },
        { karat: '18k', name: t('gold.karats.18k'), price: getDisplayPrice('18k'), highlight: true },
        { karat: '16k', name: t('gold.karats.16k'), price: getDisplayPrice('16k'), highlight: false },
        { karat: '14k', name: t('gold.karats.14k'), price: getDisplayPrice('14k'), highlight: true },
        { karat: '10k', name: t('gold.karats.10k'), price: getDisplayPrice('10k'), highlight: false },
      ]
    : [];

  const marketData = data?.source_data.market_data;
  const isPositiveChange = (marketData?.ch ?? 0) >= 0;
  const changePercent = marketData?.chp ?? 0;

  // "Last updated X ago" display
  const lastUpdatedDisplay = lastUpdated
    ? (() => {
        const seconds = Math.round((Date.now() - lastUpdated.getTime()) / 1000);
        if (seconds < 60) return t('common.justNow');
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ${t('common.ago') || 'ago'}`;
      })()
    : t('common.loading');

  return (
    <section id="gold" className="py-12">
      <div className="container mx-auto px-4">
        <Card className="glass-card shadow-2xl">
          <CardHeader className="border-b border-[rgba(212,175,55,0.15)]">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <CardTitle className="text-3xl font-bold font-serif gold-gradient-text mb-2">
                  {t('gold.title')}
                </CardTitle>
                <p className="text-[#8A8A8E]">{t('gold.subtitle')}</p>
              </div>

              <div className="flex items-center gap-4 mt-4 lg:mt-0">
                <div className="text-center">
                  <p className="text-xs text-[#8A8A8E] uppercase">{t('gold.market')}</p>
                  <p className="text-sm font-semibold text-[#22C55E]">
                    {loading ? t('common.loading') : t('common.active')}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#8A8A8E] uppercase">{t('gold.spread')}</p>
                  <p className="text-sm font-semibold font-mono text-[#E8E6E3]">0.5%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#8A8A8E] uppercase">{t('gold.volume')}</p>
                  <p className="text-sm font-semibold text-[#E8E6E3]">{t('gold.high')}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-[#1A1A2E] border border-[rgba(212,175,55,0.1)] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#8A8A8E]">{t('gold.currencyDisplay')}</p>
                    <p className="text-lg font-semibold text-[#E8E6E3]">{t(`currencies.names.${selectedCurrency}`)}</p>
                  </div>
                  <CurrencySelector />
                </div>
              </div>

              <div className="bg-[#1A1A2E] border border-[rgba(212,175,55,0.1)] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#8A8A8E]">{t('gold.lastUpdate')}</p>
                    <p className="text-lg font-semibold text-[#E8E6E3]">{lastUpdatedDisplay}</p>
                  </div>
                  <Button
                    className="bg-[#D4AF37] hover:bg-[#C9A96E] text-[#0A0A0F]"
                    size="sm"
                    onClick={refresh}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {marketData && (
              <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-4 bg-[#1A1A2E] border border-[rgba(212,175,55,0.1)] rounded-lg p-4">
                  <div>
                    <span className="text-sm text-[#8A8A8E]">{t('gold.currentOuncePrice')}</span>
                    <div
                      className={`text-2xl font-bold font-mono text-[#D4AF37] ${priceFlash ? 'animate-gold-flash' : ''}`}
                    >
                      ${marketData.current_price?.toFixed(2)}
                    </div>
                  </div>
                  <div className={`flex items-center ${isPositiveChange ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    {isPositiveChange ? (
                      <TrendingUp className="w-4 h-4 me-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 me-1" />
                    )}
                    <span className="font-semibold font-mono">
                      {isPositiveChange ? '+' : ''}
                      {marketData.ch?.toFixed(2) ?? '0.00'} ({changePercent.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="text-sm text-[#8A8A8E]">
                    {marketData.open_time
                      ? `${t('gold.dataTimestamp')} ${new Date(marketData.open_time).toLocaleString()}`
                      : t('common.loading')}
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#D4AF37]/10 text-[#D4AF37]">
                    <th className="px-4 py-3 text-start font-semibold">{t('gold.tableHeaders.karat')}</th>
                    <th className="px-4 py-3 text-center font-semibold">
                      {t('gold.tableHeaders.pricePerGram', {
                        currency: selectedCurrency,
                      })}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center">
                        <div className="flex items-center justify-center gap-2 text-[#8A8A8E]">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{t('gold.loading')}</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    goldData.map((item, index) => (
                      <tr
                        key={index}
                        className={`border-b border-[rgba(212,175,55,0.05)] ${item.highlight ? 'bg-[rgba(212,175,55,0.05)]' : ''}`}
                      >
                        <td className="px-4 py-3 font-medium text-[#E8E6E3]">{item.name}</td>
                        <td
                          className={`px-4 py-3 text-center font-semibold font-mono text-[#D4AF37] ${priceFlash ? 'animate-gold-flash' : ''}`}
                        >
                          {formatPrice(item.price, selectedCurrency, locale)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
