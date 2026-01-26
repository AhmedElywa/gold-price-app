'use client';

import { Activity, Loader2, TrendingDown, TrendingUp } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGoldData } from '@/hooks/useGoldData';
import { useTranslation } from '@/hooks/useTranslation';

export function SilverPrices() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { data, loading, error } = useGoldData();

  // Get currency from URL parameter, fallback to EGP
  const selectedCurrency = searchParams.get('currency')?.toUpperCase() || 'EGP';

  // Currency conversion function
  const getPriceInSelectedCurrency = (priceUSD: number) => {
    if (!data?.source_data?.exchange_rates) return priceUSD;
    if (selectedCurrency === 'USD') return priceUSD;

    const rate = data.source_data.exchange_rates[selectedCurrency];
    return rate ? parseFloat((priceUSD * rate).toFixed(2)) : priceUSD;
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'USD') {
      return `$${price.toFixed(2)}`;
    }
    return `${currency} ${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <section id="silver" className="py-12 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="container mx-auto px-4">
          <Card className="bg-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2">
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
      <section id="silver" className="py-12 bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="container mx-auto px-4">
          <Card className="bg-white shadow-xl">
            <CardContent className="p-6">
              <div className="text-center text-gray-500">{t('silver.error')}</div>
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
  const silverPrice = getPriceInSelectedCurrency(silverPriceUSD);
  const silverChangeConverted = getPriceInSelectedCurrency(silverChange);

  const isSilverPositive = silverChange >= 0;

  // Calculate gold to silver ratio (always in USD for consistency)
  const goldToSilverRatio = silverPriceUSD > 0 ? (marketData.current_price ?? 0) / silverPriceUSD : 0;

  // Generate different silver product prices based on spot price in selected currency
  const silverProducts = [
    {
      type: t('silver.products.spot'),
      price: formatPrice(silverPrice, selectedCurrency),
      change: `${isSilverPositive ? '+' : ''}${silverChangeConverted.toFixed(2)}`,
      percentage: `(${silverChangePercent.toFixed(2)}%)`,
      trend: isSilverPositive ? 'up' : 'down',
    },
    {
      type: t('silver.products.coins'),
      price: formatPrice(silverPrice * 1.075, selectedCurrency), // 7.5% premium
      change: `${isSilverPositive ? '+' : ''}${(silverChangeConverted * 1.075).toFixed(2)}`,
      percentage: `(${silverChangePercent.toFixed(2)}%)`,
      trend: isSilverPositive ? 'up' : 'down',
    },
    {
      type: t('silver.products.bars'),
      price: formatPrice(silverPrice * 1.007, selectedCurrency), // 0.7% premium
      change: `${isSilverPositive ? '+' : ''}${(silverChangeConverted * 1.007).toFixed(2)}`,
      percentage: `(${silverChangePercent.toFixed(2)}%)`,
      trend: isSilverPositive ? 'up' : 'down',
    },
    {
      type: t('silver.products.jewelry'),
      price: formatPrice(silverPrice * 1.175, selectedCurrency), // 17.5% premium
      change: `${isSilverPositive ? '+' : ''}${(silverChangeConverted * 1.175).toFixed(2)}`,
      percentage: `(${silverChangePercent.toFixed(2)}%)`,
      trend: isSilverPositive ? 'up' : 'down',
    },
  ];

  return (
    <section id="silver" className="py-12 bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4">
        <Card className="bg-white shadow-xl">
          <CardHeader className="bg-gradient-to-r from-slate-100 to-gray-100 border-b">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800 mb-2">{t('silver.title')}</CardTitle>
                <p className="text-gray-600">{t('silver.subtitle')}</p>
              </div>

              <div className="flex items-center gap-4 mt-4 lg:mt-0">
                <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">{t('silver.marketActive')}</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">{t('common.live')}</p>
                  <p className="text-sm font-semibold text-slate-600">{selectedCurrency}</p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {silverProducts.map((item, index) => (
                <div key={index} className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-lg p-4 border">
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-800 mb-2">{item.type}</h3>
                    <div className="text-2xl font-bold text-gray-900 mb-1">{item.price}</div>
                    <div
                      className={`flex items-center justify-center gap-1 ${
                        item.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {item.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="text-sm font-medium">
                        {item.change} {item.percentage}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">{t('silver.goldSilverRatio')}</h4>
                  <p className="text-sm text-gray-600">
                    {t('silver.currentRatio')} 1:{goldToSilverRatio.toFixed(2)}{' '}
                    {t('silver.goldExpensive', {
                      ratio: goldToSilverRatio.toFixed(0),
                    })}
                  </p>
                </div>
                <div className="text-end">
                  <div className="text-lg font-bold text-blue-600">{goldToSilverRatio.toFixed(2)}</div>
                  <div className={`text-sm ${isSilverPositive ? 'text-green-600' : 'text-red-600'}`}>
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
