'use client';

import { DollarSign } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from '@/hooks/useTranslation';

// Define available currencies organized by category
const primaryCurrencies = [
  { code: 'egp', key: 'egypt' },
  { code: 'usd', key: 'usa' },
  { code: 'eur', key: 'europe' },
];

const majorCurrencies = [
  { code: 'gbp', key: 'uk' },
  { code: 'jpy', key: 'japan' },
  { code: 'cny', key: 'china' },
  { code: 'inr', key: 'india' },
  { code: 'try', key: 'turkey' },
  { code: 'rub', key: 'russia' },
  { code: 'cad', key: 'canada' },
  { code: 'aud', key: 'australia' },
  { code: 'chf', key: 'switzerland' },
  { code: 'sgd', key: 'singapore' },
];

const gccCurrencies = [
  { code: 'sar', key: 'saudi' },
  { code: 'aed', key: 'uae' },
  { code: 'qar', key: 'qatar' },
  { code: 'kwd', key: 'kuwait' },
  { code: 'bhd', key: 'bahrain' },
  { code: 'omr', key: 'oman' },
  { code: 'jod', key: 'jordan' },
];

// Get all available currency codes
const allCurrencies = [...primaryCurrencies, ...majorCurrencies, ...gccCurrencies];

function CurrencySelectorImpl() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get currency from URL parameter, fallback to EGP
  const urlCurrency = searchParams.get('currency')?.toLowerCase();
  const validCurrency = urlCurrency && allCurrencies.some((c) => c.code === urlCurrency) ? urlCurrency : 'egp';

  const [selectedCurrency, setSelectedCurrency] = useState(validCurrency);

  // Update selected currency when URL parameter changes
  useEffect(() => {
    setSelectedCurrency(validCurrency);
  }, [validCurrency]);

  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);

    // Update URL with new currency parameter
    const params = new URLSearchParams(searchParams.toString());
    params.set('currency', newCurrency.toUpperCase());

    // Navigate to new URL with updated currency parameter
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
      <SelectTrigger className="w-9 lg:w-44 px-0 lg:px-3 justify-center lg:justify-between bg-[#1A1A2E] border-[rgba(212,175,55,0.15)] text-[#E8E6E3] [&>svg:last-of-type]:hidden lg:[&>svg:last-of-type]:inline">
        <DollarSign className="w-4 h-4 shrink-0 text-[#D4AF37]" />
        <span className="!hidden lg:!inline truncate"><SelectValue /></span>
      </SelectTrigger>
      <SelectContent>
        {/* Primary Currencies */}
        {primaryCurrencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {t(`currencies.${currency.key}`)}
          </SelectItem>
        ))}

        <SelectSeparator />

        {/* Major Currencies */}
        {majorCurrencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {t(`currencies.${currency.key}`)}
          </SelectItem>
        ))}

        <SelectSeparator />

        {/* GCC Currencies */}
        {gccCurrencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {t(`currencies.${currency.key}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Fallback component for Suspense
function CurrencyFallback() {
  const { t } = useTranslation();

  return (
    <Select defaultValue="egp">
      <SelectTrigger className="w-9 lg:w-44 px-0 lg:px-3 justify-center lg:justify-between bg-[#1A1A2E] border-[rgba(212,175,55,0.15)] text-[#E8E6E3] [&>svg:last-of-type]:hidden lg:[&>svg:last-of-type]:inline">
        <DollarSign className="w-4 h-4 shrink-0 text-[#D4AF37]" />
        <span className="!hidden lg:!inline truncate"><SelectValue /></span>
      </SelectTrigger>
      <SelectContent>
        {primaryCurrencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {t(`currencies.${currency.key}`)}
          </SelectItem>
        ))}
        <SelectSeparator />
        {majorCurrencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {t(`currencies.${currency.key}`)}
          </SelectItem>
        ))}
        <SelectSeparator />
        {gccCurrencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {t(`currencies.${currency.key}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CurrencySelector() {
  return (
    <Suspense fallback={<CurrencyFallback />}>
      <CurrencySelectorImpl />
    </Suspense>
  );
}
