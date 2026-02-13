'use client';

import { Calculator, Gem } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useGoldData } from '@/hooks/useGoldData';
import { useSelectedCurrency } from '@/hooks/useSelectedCurrency';
import { useTranslation } from '@/hooks/useTranslation';
import { formatPrice } from '@/lib/price-utils';
import type { ApiResponseData } from '@/types/api';

const KARAT_OPTIONS = ['24k', '22k', '21k', '18k'] as const;

type KaratOption = (typeof KARAT_OPTIONS)[number];

function toSafeNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function JewelryCalculator({ initialData }: { initialData?: ApiResponseData | null }) {
  const { t, locale } = useTranslation();
  const selectedCurrency = useSelectedCurrency();
  const { data, loading } = useGoldData(initialData);

  const [weightGrams, setWeightGrams] = useState('10');
  const [makingChargePercent, setMakingChargePercent] = useState('12');
  const [taxPercent, setTaxPercent] = useState('0');
  const [selectedKarat, setSelectedKarat] = useState<KaratOption>('21k');

  const perGramPrice = useMemo(() => {
    if (!data) {
      return 0;
    }

    if (selectedCurrency === 'EGP') {
      return data.gold_prices_egp_per_gram[selectedKarat] ?? 0;
    }

    const usdValue = data.source_data.gold_price_usd_per_gram[selectedKarat] ?? 0;
    if (selectedCurrency === 'USD') {
      return usdValue;
    }

    const rate = data.source_data.exchange_rates[selectedCurrency];
    if (!rate) {
      return usdValue;
    }

    return usdValue * rate;
  }, [data, selectedCurrency, selectedKarat]);

  const calculation = useMemo(() => {
    const grams = Math.max(toSafeNumber(weightGrams), 0);
    const makingPercent = Math.max(toSafeNumber(makingChargePercent), 0);
    const tax = Math.max(toSafeNumber(taxPercent), 0);

    const base = grams * perGramPrice;
    const makingFee = base * (makingPercent / 100);
    const subtotal = base + makingFee;
    const taxAmount = subtotal * (tax / 100);
    const total = subtotal + taxAmount;

    return {
      base,
      makingFee,
      taxAmount,
      total,
    };
  }, [makingChargePercent, perGramPrice, taxPercent, weightGrams]);

  return (
    <section id="calculator" className="py-12">
      <div className="container mx-auto px-4">
        <Card className="glass-card shadow-2xl">
          <CardHeader className="border-b border-[rgba(212,175,55,0.15)]">
            <CardTitle className="text-2xl font-bold font-serif gold-gradient-text flex items-center gap-2">
              <Calculator className="w-6 h-6 text-[#D4AF37]" />
              Jewelry Price Calculator
            </CardTitle>
            <p className="text-[#8A8A8E]">
              Estimate retail jewelry pricing using live gold rates, making charge, and tax.
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#8A8A8E] mb-1">Karat</label>
                  <select
                    value={selectedKarat}
                    onChange={(e) => setSelectedKarat(e.target.value as KaratOption)}
                    className="w-full p-2 rounded-md"
                  >
                    {KARAT_OPTIONS.map((karat) => (
                      <option key={karat} value={karat}>
                        {t(`gold.karats.${karat}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#8A8A8E] mb-1">Weight (grams)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={weightGrams}
                    onChange={(e) => setWeightGrams(e.target.value)}
                    className="bg-[#14141F] border-[rgba(212,175,55,0.15)] text-[#E8E6E3]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#8A8A8E] mb-1">Making charge (%)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={makingChargePercent}
                    onChange={(e) => setMakingChargePercent(e.target.value)}
                    className="bg-[#14141F] border-[rgba(212,175,55,0.15)] text-[#E8E6E3]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#8A8A8E] mb-1">Tax (%)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(e.target.value)}
                    className="bg-[#14141F] border-[rgba(212,175,55,0.15)] text-[#E8E6E3]"
                  />
                </div>
              </div>

              <div className="bg-[#1A1A2E] border border-[rgba(212,175,55,0.1)] rounded-lg p-5">
                <h3 className="font-semibold text-[#E8E6E3] mb-4 flex items-center gap-2">
                  <Gem className="w-5 h-5 text-[#D4AF37]" />
                  Calculation Summary ({selectedCurrency})
                </h3>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8A8A8E]">Price per gram ({selectedKarat})</span>
                    <span className="font-medium font-mono text-[#E8E6E3]">
                      {loading && !data ? t('common.loading') : formatPrice(perGramPrice, selectedCurrency, locale)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8A8A8E]">Gold value</span>
                    <span className="font-medium font-mono text-[#E8E6E3]">{formatPrice(calculation.base, selectedCurrency, locale)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8A8A8E]">Making charge</span>
                    <span className="font-medium font-mono text-[#E8E6E3]">
                      {formatPrice(calculation.makingFee, selectedCurrency, locale)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8A8A8E]">Tax amount</span>
                    <span className="font-medium font-mono text-[#E8E6E3]">
                      {formatPrice(calculation.taxAmount, selectedCurrency, locale)}
                    </span>
                  </div>
                  <div className="border-t border-[rgba(212,175,55,0.15)] pt-3 flex items-center justify-between">
                    <span className="text-[#E8E6E3] font-semibold">Estimated total</span>
                    <span className="text-lg font-bold font-mono text-[#D4AF37]">
                      {formatPrice(calculation.total, selectedCurrency, locale)}
                    </span>
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
