"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select";
import { DollarSign } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

// Define available currencies organized by category
const primaryCurrencies = [
  { code: "egp", key: "egypt" },
  { code: "usd", key: "usa" },
  { code: "eur", key: "europe" },
];

const majorCurrencies = [
  { code: "gbp", key: "uk" },
  { code: "jpy", key: "japan" },
  { code: "cny", key: "china" },
  { code: "inr", key: "india" },
  { code: "try", key: "turkey" },
  { code: "rub", key: "russia" },
  { code: "cad", key: "canada" },
  { code: "aud", key: "australia" },
  { code: "chf", key: "switzerland" },
  { code: "sgd", key: "singapore" },
];

const gccCurrencies = [
  { code: "sar", key: "saudi" },
  { code: "aed", key: "uae" },
  { code: "qar", key: "qatar" },
  { code: "kwd", key: "kuwait" },
  { code: "bhd", key: "bahrain" },
  { code: "omr", key: "oman" },
  { code: "jod", key: "jordan" },
];

// Get all available currency codes
const allCurrencies = [
  ...primaryCurrencies,
  ...majorCurrencies,
  ...gccCurrencies,
];

function CurrencySelectorImpl() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get currency from URL parameter, fallback to EGP
  const urlCurrency = searchParams.get("currency")?.toLowerCase();
  const validCurrency =
    urlCurrency && allCurrencies.some((c) => c.code === urlCurrency)
      ? urlCurrency
      : "egp";

  const [selectedCurrency, setSelectedCurrency] = useState(validCurrency);

  // Update selected currency when URL parameter changes
  useEffect(() => {
    setSelectedCurrency(validCurrency);
  }, [validCurrency]);

  const handleCurrencyChange = (newCurrency: string) => {
    setSelectedCurrency(newCurrency);

    // Update URL with new currency parameter
    const params = new URLSearchParams(searchParams.toString());
    params.set("currency", newCurrency.toUpperCase());

    // Navigate to new URL with updated currency parameter
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select value={selectedCurrency} onValueChange={handleCurrencyChange}>
      <SelectTrigger className="w-44 bg-white/10 border-white/20 text-white">
        <DollarSign className="w-4 h-4 me-2" />
        <SelectValue />
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
      <SelectTrigger className="w-44 bg-white/10 border-white/20 text-white">
        <DollarSign className="w-4 h-4 me-2" />
        <SelectValue />
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
