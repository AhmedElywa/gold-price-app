"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TrendingUp, Calculator, Globe, Clock, Loader2 } from "lucide-react";
import { useGoldData } from "@/hooks/useGoldData";
import { useState, useMemo } from "react";

// Currency flags mapping
const currencyFlags: Record<string, string> = {
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  JPY: "🇯🇵",
  CNY: "🇨🇳",
  INR: "🇮🇳",
  TRY: "🇹🇷",
  RUB: "🇷🇺",
  CAD: "🇨🇦",
  AUD: "🇦🇺",
  CHF: "🇨🇭",
  SGD: "🇸🇬",
  SAR: "🇸🇦",
  AED: "🇦🇪",
  QAR: "🇶🇦",
  KWD: "🇰🇼",
  BHD: "🇧🇭",
  OMR: "🇴🇲",
  JOD: "🇯🇴",
  EGP: "🇪🇬",
};

// Currency names mapping
const currencyNames: Record<string, string> = {
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  JPY: "Japanese Yen",
  CNY: "Chinese Yuan",
  INR: "Indian Rupee",
  TRY: "Turkish Lira",
  RUB: "Russian Ruble",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  CHF: "Swiss Franc",
  SGD: "Singapore Dollar",
  SAR: "Saudi Riyal",
  AED: "UAE Dirham",
  QAR: "Qatari Riyal",
  KWD: "Kuwaiti Dinar",
  BHD: "Bahraini Dinar",
  OMR: "Omani Rial",
  JOD: "Jordanian Dinar",
  EGP: "Egyptian Pound",
};

export function ExchangeRates() {
  const { data, loading, error, lastUpdated } = useGoldData();
  const [converterAmount, setConverterAmount] = useState("100");
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("EGP");

  const exchangeRates = useMemo(() => {
    return data?.source_data.exchange_rates || {};
  }, [data?.source_data.exchange_rates]);

  // Calculate conversion result
  const conversionResult = useMemo(() => {
    if (!converterAmount || isNaN(Number(converterAmount))) return 0;

    const amount = Number(converterAmount);
    let fromRate = 1; // USD is base
    let toRate = 1;

    if (fromCurrency !== "USD") {
      fromRate = exchangeRates[fromCurrency] || 1;
    }
    if (toCurrency !== "USD") {
      toRate = exchangeRates[toCurrency] || 1;
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
          <Card className="bg-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading exchange rates...</span>
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
          <Card className="bg-white shadow-xl">
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                Unable to load exchange rates data
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  // Categorize currencies
  const majorCurrencies = ["USD", "EUR", "GBP", "JPY"].filter(
    (curr) => exchangeRates[curr]
  );
  const gccCurrencies = ["SAR", "AED", "QAR", "KWD", "BHD", "OMR"].filter(
    (curr) => exchangeRates[curr]
  );
  const otherCurrencies = Object.keys(exchangeRates).filter(
    (curr) =>
      !majorCurrencies.includes(curr) &&
      !gccCurrencies.includes(curr) &&
      curr !== "EGP"
  );

  const formatCurrencyData = (currencies: string[]) => {
    return currencies.map((currency) => {
      const rate = exchangeRates[currency];
      return {
        currency,
        flag: currencyFlags[currency] || "🏳️",
        rate: rate.toFixed(4),
        change: "+0.00", // We don't have historical data for change calculation
        trend: "up" as const,
        name: currencyNames[currency] || currency,
      };
    });
  };

  const majorCurrenciesData = formatCurrencyData(majorCurrencies);
  const gccCurrenciesData = formatCurrencyData(gccCurrencies);
  const otherCurrenciesData = formatCurrencyData(otherCurrencies);

  return (
    <section id="exchange" className="py-12">
      <div className="container mx-auto px-4">
        <Card className="bg-white shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
                  Currency Exchange Hub
                </CardTitle>
                <p className="text-gray-600">
                  Live rates against USD • Converted to EGP
                </p>
              </div>

              <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                <div className="flex items-center space-x-2 bg-white rounded-lg px-3 py-2 shadow-sm">
                  <Clock className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Markets Open</span>
                </div>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculator
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Quick Converter */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-blue-500" />
                Quick Currency Converter
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Amount
                  </label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={converterAmount}
                    onChange={(e) => setConverterAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    From
                  </label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={fromCurrency}
                    onChange={(e) => setFromCurrency(e.target.value)}
                  >
                    {Object.keys(exchangeRates)
                      .sort()
                      .map((currency) => (
                        <option key={currency} value={currency}>
                          {currency} {currencyFlags[currency] || ""}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">To</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={toCurrency}
                    onChange={(e) => setToCurrency(e.target.value)}
                  >
                    {Object.keys(exchangeRates)
                      .sort()
                      .map((currency) => (
                        <option key={currency} value={currency}>
                          {currency} {currencyFlags[currency] || ""}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Result
                  </label>
                  <div className="p-2 bg-gray-50 border rounded-md font-semibold">
                    {conversionResult.toFixed(2)} {toCurrency}
                  </div>
                </div>
                <Button
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                  onClick={() => {
                    // Swap currencies
                    const temp = fromCurrency;
                    setFromCurrency(toCurrency);
                    setToCurrency(temp);
                  }}
                >
                  Swap
                </Button>
              </div>
            </div>

            {/* Major Currencies */}
            {majorCurrenciesData.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-blue-500" />
                  Major Currencies (to EGP)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {majorCurrenciesData.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{item.flag}</span>
                          <div>
                            <div className="font-semibold text-gray-800">
                              {item.currency}
                            </div>
                            <div className="text-xs text-gray-500">
                              {item.name}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center text-green-600">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="text-lg font-bold text-gray-900">
                        {item.rate} EGP
                      </div>
                      <div className="text-sm text-gray-500">Live rate</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GCC Currencies */}
            {gccCurrenciesData.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  GCC Currencies (to EGP)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {gccCurrenciesData.map((item, index) => (
                    <div
                      key={index}
                      className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center"
                    >
                      <div className="text-xl mb-1">{item.flag}</div>
                      <div className="font-semibold text-gray-800">
                        {item.currency}
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        {item.rate}
                      </div>
                      <div className="text-xs text-gray-500">Live</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Other Currencies */}
            {otherCurrenciesData.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Other Currencies (to EGP)
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {otherCurrenciesData.map((item, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 border rounded-lg p-3 text-center"
                    >
                      <div className="text-xl mb-1">{item.flag}</div>
                      <div className="font-semibold text-gray-800">
                        {item.currency}
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        {item.rate}
                      </div>
                      <div className="text-xs text-gray-500">Live</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Last updated:{" "}
                {lastUpdated ? lastUpdated.toLocaleString() : "Loading..."} •
                Data provided by ExchangeRate-API
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
