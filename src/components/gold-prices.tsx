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
import { useState } from "react";

export function GoldPrices() {
  const { data, loading, error, lastUpdated, refresh } = useGoldData();
  const [selectedCurrency, setSelectedCurrency] = useState("EGP");

  if (error) {
    return (
      <section id="gold" className="py-12">
        <div className="container mx-auto px-4">
          <Card className="bg-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span>Error loading gold prices: {error}</span>
                <Button onClick={refresh} variant="outline" size="sm">
                  Retry
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

  const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const goldPricesDisplay =
    selectedCurrency === "EGP"
      ? data?.gold_prices_egp_per_gram
      : data?.source_data.gold_price_usd_per_gram;

  const goldData = goldPricesDisplay
    ? [
        { karat: "24k Gold", price: goldPricesDisplay["24k"], highlight: true },
        {
          karat: "22k Gold",
          price: goldPricesDisplay["22k"],
          highlight: false,
        },
        { karat: "21k Gold", price: goldPricesDisplay["21k"], highlight: true },
        {
          karat: "20k Gold",
          price: goldPricesDisplay["20k"],
          highlight: false,
        },
        { karat: "18k Gold", price: goldPricesDisplay["18k"], highlight: true },
        {
          karat: "16k Gold",
          price: goldPricesDisplay["16k"],
          highlight: false,
        },
        { karat: "14k Gold", price: goldPricesDisplay["14k"], highlight: true },
        {
          karat: "10k Gold",
          price: goldPricesDisplay["10k"],
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
                  Precious Metals Exchange
                </CardTitle>
                <p className="text-gray-600">
                  Live spot prices • Updated every minute
                </p>
              </div>

              <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Market</p>
                  <p className="text-sm font-semibold text-green-600">
                    {loading ? "Loading..." : "Active"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Spread</p>
                  <p className="text-sm font-semibold text-gray-800">0.5%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">Volume</p>
                  <p className="text-sm font-semibold text-gray-800">High</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Currency Display</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {selectedCurrency === "EGP"
                        ? "Egyptian Pound (EGP)"
                        : "US Dollar (USD)"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSelectedCurrency(
                        selectedCurrency === "EGP" ? "USD" : "EGP"
                      )
                    }
                  >
                    Change
                  </Button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Last Update</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {lastUpdated ? "Just now" : "Loading..."}
                    </p>
                  </div>
                  <Button
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    size="sm"
                    onClick={refresh}
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
                <div className="inline-flex items-center space-x-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <span className="text-sm text-gray-600">
                      Current Ounce Price (USD)
                    </span>
                    <div className="text-2xl font-bold text-gray-800">
                      ${marketData.current_price.toFixed(2)}
                    </div>
                  </div>
                  <div
                    className={`flex items-center ${
                      isPositiveChange ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isPositiveChange ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    <span className="font-semibold">
                      {isPositiveChange ? "+" : ""}
                      {marketData.ch?.toFixed(2) ?? "0.00"} (
                      {changePercent.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {lastUpdated
                      ? `Data timestamp: ${formatDateTime(lastUpdated)}`
                      : "Loading..."}
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-amber-500 text-white">
                    <th className="px-4 py-3 text-left font-semibold">KARAT</th>
                    <th className="px-4 py-3 text-center font-semibold">
                      {selectedCurrency} PRICE (per gram)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Loading gold prices...</span>
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
                          {item.karat}
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
