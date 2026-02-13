'use client';

import { Calculator, Clock, Globe, Loader2, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useGoldData } from '@/hooks/useGoldData';
import { useSelectedCurrency } from '@/hooks/useSelectedCurrency';
import { useTranslation } from '@/hooks/useTranslation';
import type { ApiResponseData } from '@/types/api';

// Currency flags mapping
const currencyFlags: Record<string, string> = {
  USD: '\u{1F1FA}\u{1F1F8}',
  EUR: '\u{1F1EA}\u{1F1FA}',
  GBP: '\u{1F1EC}\u{1F1E7}',
  JPY: '\u{1F1EF}\u{1F1F5}',
  CNY: '\u{1F1E8}\u{1F1F3}',
  INR: '\u{1F1EE}\u{1F1F3}',
  TRY: '\u{1F1F9}\u{1F1F7}',
  RUB: '\u{1F1F7}\u{1F1FA}',
  CAD: '\u{1F1E8}\u{1F1E6}',
  AUD: '\u{1F1E6}\u{1F1FA}',
  CHF: '\u{1F1E8}\u{1F1ED}',
  SGD: '\u{1F1F8}\u{1F1EC}',
  SAR: '\u{1F1F8}\u{1F1E6}',
  AED: '\u{1F1E6}\u{1F1EA}',
  QAR: '\u{1F1F6}\u{1F1E6}',
  KWD: '\u{1F1F0}\u{1F1FC}',
  BHD: '\u{1F1E7}\u{1F1ED}',
  OMR: '\u{1F1F4}\u{1F1F2}',
  JOD: '\u{1F1EF}\u{1F1F4}',
  EGP: '\u{1F1EA}\u{1F1EC}',
};

export function ExchangeRates({ initialData }: { initialData?: ApiResponseData | null }) {
  const { t } = useTranslation();
  const selectedCurrency = useSelectedCurrency();
  const { data, loading, error, lastUpdated } = useGoldData(initialData);
  const [converterAmount, setConverterAmount] = useState('100');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EGP');

  const exchangeRates = useMemo(() => {
    return data?.source_data.exchange_rates || {};
  }, [data?.source_data.exchange_rates]);

  // Calculate conversion result
  const conversionResult = useMemo(() => {
    if (!converterAmount || Number.isNaN(Number(converterAmount))) return 0;

    const amount = Number(converterAmount);
    let fromRate = 1; // USD is base
    let toRate = 1;

    if (fromCurrency !== 'USD') {
      fromRate = exchangeRates[fromCurrency] ?? 1;
    }
    if (toCurrency !== 'USD') {
      toRate = exchangeRates[toCurrency] ?? 1;
    }

    // Convert: amount in fromCurrency -> USD -> toCurrency
    const usdAmount = amount / fromRate;
    const result = usdAmount * toRate;

    return result;
  }, [converterAmount, fromCurrency, toCurrency, exchangeRates]);

  if (loading) {
    return (
      <section id="exchange" className="py-12">
        <div className="container mx-auto px-4">
          <Card className="glass-card shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 text-[#8A8A8E]">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('exchange.loading')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section id="exchange" className="py-12">
        <div className="container mx-auto px-4">
          <Card className="glass-card shadow-2xl">
            <CardContent className="p-6">
              <div className="text-center text-[#8A8A8E]">{t('exchange.error')}</div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  // Categorize currencies
  const majorCurrencies = ['USD', 'EUR', 'GBP', 'JPY'].filter((curr) => exchangeRates[curr]);
  const gccCurrencies = ['SAR', 'AED', 'QAR', 'KWD', 'BHD', 'OMR'].filter((curr) => exchangeRates[curr]);
  const otherCurrencies = Object.keys(exchangeRates).filter(
    (curr) => !majorCurrencies.includes(curr) && !gccCurrencies.includes(curr) && curr !== selectedCurrency,
  );

  const formatCurrencyData = (currencies: string[]) => {
    return currencies.map((currency) => {
      const rate = exchangeRates[currency] ?? 0;
      // Calculate rate to selected currency
      const selectedRate = exchangeRates[selectedCurrency] ?? 1;
      const convertedRate = selectedCurrency === 'USD' ? rate : rate / selectedRate;

      return {
        currency,
        flag: currencyFlags[currency] ?? '\u{1F3F3}\u{FE0F}',
        rate: convertedRate.toFixed(4),
        change: '+0.00', // We don't have historical data for change calculation
        trend: 'up' as const,
        name: t(`currencies.names.${currency}`) || currency,
      };
    });
  };

  const majorCurrenciesData = formatCurrencyData(majorCurrencies);
  const gccCurrenciesData = formatCurrencyData(gccCurrencies);
  const otherCurrenciesData = formatCurrencyData(otherCurrencies);

  return (
    <section id="exchange" className="py-12">
      <div className="container mx-auto px-4">
        <Card className="glass-card shadow-2xl">
          <CardHeader className="border-b border-[rgba(212,175,55,0.15)]">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-2xl font-bold font-serif gold-gradient-text mb-2">{t('exchange.title')}</CardTitle>
                <p className="text-[#8A8A8E]">
                  {t('exchange.subtitle', {
                    fromCurrency: fromCurrency,
                    toCurrency: toCurrency,
                  })}
                </p>
              </div>

              <div className="flex items-center gap-4 mt-4 lg:mt-0">
                <div className="flex items-center gap-2 bg-[#1A1A2E] border border-[rgba(212,175,55,0.1)] rounded-lg px-3 py-2">
                  <Clock className="w-4 h-4 text-[#22C55E]" />
                  <span className="text-sm font-medium text-[#E8E6E3]">{t('exchange.marketsOpen')}</span>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#8A8A8E] uppercase">{t('common.live')}</p>
                  <p className="text-sm font-semibold font-mono text-[#D4AF37]">{selectedCurrency}</p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Quick Converter */}
            <div className="bg-[#1A1A2E] border border-[rgba(212,175,55,0.1)] rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-[#E8E6E3] mb-3 flex items-center">
                <Calculator className="w-5 h-5 me-2 text-[#D4AF37]" />
                {t('exchange.quickConverter')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-sm text-[#8A8A8E] mb-1">{t('exchange.amount')}</label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={converterAmount}
                    onChange={(e) => setConverterAmount(e.target.value)}
                    className="bg-[#14141F] border-[rgba(212,175,55,0.15)] text-[#E8E6E3]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#8A8A8E] mb-1">{t('exchange.from')}</label>
                  <select
                    className="w-full p-2 rounded-md"
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                  >
                    {Object.keys(exchangeRates)
                      .sort()
                      .map((currency) => (
                        <option key={currency} value={currency}>
                          {currency} {currencyFlags[currency] || ''}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#8A8A8E] mb-1">{t('exchange.to')}</label>
                  <select
                    className="w-full p-2 rounded-md"
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                  >
                    {Object.keys(exchangeRates)
                      .sort()
                      .map((currency) => (
                        <option key={currency} value={currency}>
                          {currency} {currencyFlags[currency] || ''}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#8A8A8E] mb-1">{t('exchange.result')}</label>
                  <div className="p-2 bg-[#14141F] border border-[rgba(212,175,55,0.15)] rounded-md font-semibold font-mono text-[#D4AF37]">
                    {conversionResult.toFixed(2)} {toCurrency}
                  </div>
                </div>
                <Button
                  className="bg-[#D4AF37] hover:bg-[#C9A96E] text-[#0A0A0F]"
                  onClick={() => {
                    // Swap currencies
                    const temp = fromCurrency;
                    setFromCurrency(toCurrency);
                    setToCurrency(temp);
                  }}
                >
                  {t('common.swap')}
                </Button>
              </div>
            </div>

            {/* Major Currencies */}
            {majorCurrenciesData.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-[#E8E6E3] mb-4 flex items-center">
                  <Globe className="w-5 h-5 me-2 text-[#D4AF37]" />
                  {t('exchange.categories.major', {
                    currency: selectedCurrency,
                  })}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {majorCurrenciesData.map((item, index) => (
                    <div key={index} className="glass-card p-4 hover:scale-[1.02] transition-transform">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{item.flag}</span>
                          <div>
                            <div className="font-semibold text-[#E8E6E3]">{item.currency}</div>
                            <div className="text-xs text-[#8A8A8E]">{item.name}</div>
                          </div>
                        </div>
                        <div className="flex items-center text-[#22C55E]">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-lg font-bold font-mono text-[#D4AF37]">
                        {item.rate} {selectedCurrency}
                      </div>
                      <div className="text-sm text-[#8A8A8E]">{t('common.liveRate')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GCC Currencies */}
            {gccCurrenciesData.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-[#E8E6E3] mb-4">
                  {t('exchange.categories.gcc', { currency: selectedCurrency })}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {gccCurrenciesData.map((item, index) => (
                    <div key={index} className="bg-[#1A1A2E] border border-[rgba(212,175,55,0.15)] rounded-lg p-3 text-center hover:border-[rgba(212,175,55,0.3)] transition-colors">
                      <div className="text-xl mb-1">{item.flag}</div>
                      <div className="font-semibold text-[#E8E6E3]">{item.currency}</div>
                      <div className="text-sm font-bold font-mono text-[#D4AF37]">{item.rate}</div>
                      <div className="text-xs text-[#8A8A8E]">{t('common.live')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Currencies */}
            {otherCurrenciesData.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-[#E8E6E3] mb-4">
                  {t('exchange.categories.other', {
                    currency: selectedCurrency,
                  })}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {otherCurrenciesData.map((item, index) => (
                    <div key={index} className="bg-[#14141F] border border-[rgba(212,175,55,0.1)] rounded-lg p-3 text-center hover:border-[rgba(212,175,55,0.2)] transition-colors">
                      <div className="text-xl mb-1">{item.flag}</div>
                      <div className="font-semibold text-[#E8E6E3]">{item.currency}</div>
                      <div className="text-sm font-bold font-mono text-[#D4AF37]">{item.rate}</div>
                      <div className="text-xs text-[#8A8A8E]">{t('common.live')}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-[#8A8A8E]">
                {t('exchange.lastUpdated')} {lastUpdated ? lastUpdated.toLocaleString() : t('common.loading')} •
                {t('exchange.dataProvider')}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
