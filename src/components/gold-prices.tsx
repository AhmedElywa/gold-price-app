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
      const hasChanged = prevDataRef.current !== null && prevDataRef.current !== dataKey;
      prevDataRef.current = dataKey;

      if (hasChanged) {
        setPriceFlash(true);
        const timer = setTimeout(() => setPriceFlash(false), 800);
        return () => clearTimeout(timer);
      }
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
          <CardHeader className="border-b border-[rgba(212,175,55,0.15)] px-4 py-4 md:p-6">
            <div className="flex items-center justify-between mb-3 md:mb-6">
              <div>
                <CardTitle className="text-xl md:text-3xl font-bold font-serif gold-gradient-text mb-0.5 md:mb-2">
                  {t('gold.title')}
                </CardTitle>
                <p className="text-xs md:text-base text-[#8A8A8E]">{t('gold.subtitle')}</p>
              </div>

              <div className="flex items-center gap-3 md:gap-4">
                <div className="text-center">
                  <p className="text-[10px] md:text-xs text-[#8A8A8E] uppercase">{t('gold.market')}</p>
                  <p className="text-xs md:text-sm font-semibold text-[#22C55E]">
                    {loading ? '...' : t('common.active')}
                  </p>
                </div>
                <div className="hidden md:block text-center">
                  <p className="text-xs text-[#8A8A8E] uppercase">{t('gold.spread')}</p>
                  <p className="text-sm font-semibold font-mono text-[#E8E6E3]">0.5%</p>
                </div>
                <div className="hidden md:block text-center">
                  <p className="text-xs text-[#8A8A8E] uppercase">{t('gold.volume')}</p>
                  <p className="text-sm font-semibold text-[#E8E6E3]">{t('gold.high')}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:gap-4">
              <div className="bg-[#1A1A2E] border border-[rgba(212,175,55,0.1)] rounded-lg p-2.5 md:p-4">
                <div className="flex items-center justify-between gap-1">
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-sm text-[#8A8A8E]">{t('gold.currencyDisplay')}</p>
                    <p className="text-sm md:text-lg font-semibold text-[#E8E6E3] truncate">{t(`currencies.names.${selectedCurrency}`)}</p>
                  </div>
                  <CurrencySelector />
                </div>
              </div>

              <div className="bg-[#1A1A2E] border border-[rgba(212,175,55,0.1)] rounded-lg p-2.5 md:p-4">
                <div className="flex items-center justify-between gap-1">
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-sm text-[#8A8A8E]">{t('gold.lastUpdate')}</p>
                    <p className="text-sm md:text-lg font-semibold text-[#E8E6E3]">{lastUpdatedDisplay}</p>
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
              <div className="mb-6">
                <div className="bg-[#1A1A2E] border border-[rgba(212,175,55,0.1)] rounded-lg p-4 md:p-5">
                  <div className="flex flex-col items-center gap-2 md:flex-row md:justify-between md:items-center">
                    <div className="text-center md:text-start">
                      <span className="text-xs text-[#8A8A8E] uppercase tracking-wide">{t('gold.currentOuncePrice')}</span>
                      <div
                        className={`text-3xl md:text-2xl font-bold font-mono text-[#D4AF37] mt-0.5 ${priceFlash ? 'animate-gold-flash' : ''}`}
                      >
                        ${marketData.current_price?.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold font-mono ${isPositiveChange ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
                        {isPositiveChange ? (
                          <TrendingUp className="w-3.5 h-3.5" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isPositiveChange ? '+' : ''}
                          {marketData.ch?.toFixed(2) ?? '0.00'} ({changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-[#8A8A8E]/70 text-center md:text-end mt-2">
                    {marketData.open_time
                      ? `${t('gold.dataTimestamp')} ${new Date(marketData.open_time).toLocaleString()}`
                      : t('common.loading')}
                  </p>
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
