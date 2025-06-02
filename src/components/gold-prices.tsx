"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useGoldData } from "@/hooks/useGoldData";
import { useState, useEffect, useCallback } from "react";
import { CurrencySelector } from "@/components/currency-selector";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";

export function GoldPrices() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const { data, loading, error, lastUpdated, refresh } = useGoldData();
  const [nextUpdateTime, setNextUpdateTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");

  // Get currency from URL parameter, fallback to EGP
  const selectedCurrency = searchParams.get("currency")?.toUpperCase() || "EGP";

  // Enhanced refresh function with auto-update timer
  const enhancedRefresh = useCallback(async () => {
    await refresh();

    // Set the next update time to 30 minutes from now
    const nextUpdate = new Date();
    nextUpdate.setMinutes(nextUpdate.getMinutes() + 30);
    setNextUpdateTime(nextUpdate);

    // Initialize the time remaining display
    const minutes = 30;
    const seconds = 0;
    setTimeRemaining(`${minutes}m ${seconds}s`);
  }, [refresh]);

  // Auto-refresh timer setup
  useEffect(() => {
    // Initial setup of auto-refresh
    if (data && !nextUpdateTime) {
      const nextUpdate = new Date();
      nextUpdate.setMinutes(nextUpdate.getMinutes() + 30);
      setNextUpdateTime(nextUpdate);
      setTimeRemaining("30m 0s");
    }

    // Set up auto-refresh every 30 minutes
    const interval = setInterval(enhancedRefresh, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [data, nextUpdateTime, enhancedRefresh]);

  // Countdown timer effect
  useEffect(() => {
    const timerInterval = setInterval(() => {
      if (nextUpdateTime) {
        const now = new Date();
        const diff = nextUpdateTime.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeRemaining(t("common.updatingSoon"));
        } else {
          const minutes = Math.floor(diff / 60000);
          const seconds = Math.floor((diff % 60000) / 1000);
          setTimeRemaining(`${minutes}m ${seconds}s`);
        }
      }
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [nextUpdateTime, t]);

  // Currency conversion function
  const getPriceInSelectedCurrency = (priceUSD: number) => {
    if (!data?.source_data?.exchange_rates) return priceUSD;
    if (selectedCurrency === "USD") return priceUSD;

    const rate = data.source_data.exchange_rates[selectedCurrency];
    return rate ? parseFloat((priceUSD * rate).toFixed(2)) : priceUSD;
  };

  if (error) {
    return (
      <section id="gold" className="py-12">
        <div className="container mx-auto px-4">
          <Card className="bg-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span>
                  {t("gold.error")} {error}
                </span>
                <Button onClick={enhancedRefresh} variant="outline" size="sm">
                  {t("common.retry")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  const formatPrice = (price: number, currency: string) => {
    if (currency === "USD") {
      return `$${price.toFixed(2)}`;
    }
    return `${currency} ${price.toFixed(2)}`;
  };

  // Determine which prices to display based on selected currency
  const goldPricesDisplay =
    selectedCurrency === "EGP"
      ? data?.gold_prices_egp_per_gram
      : data?.source_data.gold_price_usd_per_gram;

  // Convert USD prices to selected currency if needed
  const getDisplayPrice = (
    karat: "24k" | "22k" | "21k" | "20k" | "18k" | "16k" | "14k" | "10k"
  ) => {
    if (selectedCurrency === "EGP" && data?.gold_prices_egp_per_gram) {
      return data.gold_prices_egp_per_gram[karat];
    } else if (
      selectedCurrency === "USD" &&
      data?.source_data.gold_price_usd_per_gram
    ) {
      return data.source_data.gold_price_usd_per_gram[karat] || 0;
    } else if (data?.source_data.gold_price_usd_per_gram) {
      // Convert USD to selected currency
      const usdPrice = data.source_data.gold_price_usd_per_gram[karat] || 0;
      return getPriceInSelectedCurrency(usdPrice);
    }
    return 0;
  };

  const goldData = goldPricesDisplay
    ? [
        {
          karat: "24k",
          name: t("gold.karats.24k"),
          price: getDisplayPrice("24k"),
          highlight: true,
        },
        {
          karat: "22k",
          name: t("gold.karats.22k"),
          price: getDisplayPrice("22k"),
          highlight: false,
        },
        {
          karat: "21k",
          name: t("gold.karats.21k"),
          price: getDisplayPrice("21k"),
          highlight: true,
        },
        {
          karat: "20k",
          name: t("gold.karats.20k"),
          price: getDisplayPrice("20k"),
          highlight: false,
        },
        {
          karat: "18k",
          name: t("gold.karats.18k"),
          price: getDisplayPrice("18k"),
          highlight: true,
        },
        {
          karat: "16k",
          name: t("gold.karats.16k"),
          price: getDisplayPrice("16k"),
          highlight: false,
        },
        {
          karat: "14k",
          name: t("gold.karats.14k"),
          price: getDisplayPrice("14k"),
          highlight: true,
        },
        {
          karat: "10k",
          name: t("gold.karats.10k"),
          price: getDisplayPrice("10k"),
          highlight: false,
        },
      ]
    : [];

  const marketData = data?.source_data.market_data;
  const isPositiveChange = (marketData?.ch ?? 0) >= 0;
  const changePercent = marketData?.chp ?? 0;

  return (
    <section id="gold" className="py-12">
      <div className="container mx-auto px-4">
        <Card className="bg-white shadow-xl">
          <CardHeader className="bg-white border-b">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div>
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                  {t("gold.title")}
                </CardTitle>
                <p className="text-gray-600">{t("gold.subtitle")}</p>
              </div>

              <div className="flex items-center gap-4 mt-4 lg:mt-0">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">
                    {t("gold.market")}
                  </p>
                  <p className="text-sm font-semibold text-green-600">
                    {loading ? t("common.loading") : t("common.active")}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">
                    {t("gold.spread")}
                  </p>
                  <p className="text-sm font-semibold text-gray-800">0.5%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">
                    {t("gold.volume")}
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    {t("gold.high")}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {t("gold.currencyDisplay")}
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                      {t(`currencies.names.${selectedCurrency}`)}
                    </p>
                  </div>
                  <CurrencySelector />
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      {t("gold.lastUpdate")}
                    </p>
                    <p className="text-lg font-semibold text-gray-800">
                      {lastUpdated ? t("common.justNow") : t("common.loading")}
                    </p>
                    {nextUpdateTime && (
                      <p className="text-xs text-gray-500 mt-1">
                        {t("goldPrices.nextUpdate")}: {timeRemaining}
                      </p>
                    )}
                  </div>
                  <Button
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    size="sm"
                    onClick={enhancedRefresh}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {marketData && (
              <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <span className="text-sm text-gray-600">
                      {t("gold.currentOuncePrice")}
                    </span>
                    <div className="text-2xl font-bold text-gray-800">
                      ${marketData.current_price?.toFixed(2)}
                    </div>
                  </div>
                  <div
                    className={`flex items-center ${
                      isPositiveChange ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isPositiveChange ? (
                      <TrendingUp className="w-4 h-4 me-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 me-1" />
                    )}
                    <span className="font-semibold">
                      {isPositiveChange ? "+" : ""}
                      {marketData.ch?.toFixed(2) ?? "0.00"} (
                      {changePercent.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {marketData.open_time
                      ? `${t("gold.dataTimestamp")} ${new Date(
                          marketData.open_time
                        ).toLocaleString()}`
                      : t("common.loading")}
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-amber-500 text-white">
                    <th className="px-4 py-3 text-start font-semibold">
                      {t("gold.tableHeaders.karat")}
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      {t("gold.tableHeaders.pricePerGram", {
                        currency: selectedCurrency,
                      })}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>{t("gold.loading")}</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    goldData.map((item, index) => (
                      <tr
                        key={index}
                        className={item.highlight ? "bg-amber-100" : "bg-white"}
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold">
                          {formatPrice(item.price, selectedCurrency)}
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
