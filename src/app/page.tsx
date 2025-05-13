"use client";

import { useState, useEffect } from "react";

interface GoldData {
  source_data: {
    gold_price_usd_per_gram: {
      "24k": number;
      "22k": number;
      "21k": number;
      "20k": number;
      "18k": number;
      "16k": number;
      "14k": number;
      "10k": number;
    };
    exchange_rates: {
      [key: string]: number;
    };
    market_data?: {
      current_price?: number;
      prev_close_price?: number;
      ch?: number;
      chp?: number;
      silver_price?: number;
      silver_change?: number;
      silver_change_percent?: number;
      open_time: number;
      exchange?: string;
      symbol?: string;
    };
  };
  gold_prices_egp_per_gram: {
    "24k": number;
    "22k": number;
    "21k": number;
    "20k": number;
    "18k": number;
    "16k": number;
    "14k": number;
    "10k": number;
  };
  last_updated: string;
}

export default function GoldPricePage() {
  const [goldData, setGoldData] = useState<GoldData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState("EGP");
  const [mounted, setMounted] = useState(false);

  const fetchGoldPrices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/gold-prices-egp");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setGoldData(data);
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error
          ? e.message
          : "Failed to load gold prices. Please try again later.";
      setError(errorMessage);
      setGoldData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchGoldPrices(); // Initial fetch
    const interval = setInterval(fetchGoldPrices, 300000); // 300,000 ms = 5 minutes

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  const getPriceInSelectedCurrency = (priceUSD: number) => {
    if (!goldData?.source_data?.exchange_rates) return 0;
    const rate = goldData.source_data.exchange_rates[selectedCurrency];
    return parseFloat((priceUSD * rate).toFixed(2));
  };

  const getExchangeRate = (currency: string) => {
    if (!goldData?.source_data?.exchange_rates) return 0;
    const selectedRate = goldData.source_data.exchange_rates[selectedCurrency];
    const targetRate = goldData.source_data.exchange_rates[currency];
    // Calculate how many units of selected currency you get for 1 unit of the target currency
    return parseFloat((selectedRate / targetRate).toFixed(4));
  };

  const karatColors = {
    "24k": "bg-yellow-500",
    "22k": "",
    "21k": "bg-yellow-300",
    "20k": "",
    "18k": "bg-amber-400",
    "16k": "",
    "14k": "bg-amber-200",
    "10k": "",
  };

  // Don't render anything until the component is mounted
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-600 flex flex-col items-center justify-center p-4 text-white">
      <div className="bg-white bg-opacity-20 backdrop-blur-md shadow-xl rounded-xl p-6 md:p-10 w-full max-w-4xl">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-center text-gray-800">
            Live Gold Prices
          </h1>
          <p className="text-sm text-center text-gray-700 mt-2">
            Prices per gram in selected currency
          </p>
          {goldData?.source_data?.exchange_rates && (
            <div className="mt-4 flex justify-center">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
              >
                {Object.keys(goldData.source_data.exchange_rates).map(
                  (currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  )
                )}
              </select>
            </div>
          )}
        </header>

        {loading && !error && (
          <div className="text-center text-gray-700">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4">Loading prices...</p>
          </div>
        )}

        {error && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md"
            role="alert"
          >
            <p className="font-bold">Error</p>
            <p>{error} Please try refreshing the page or check back later.</p>
          </div>
        )}

        {!loading &&
          !error &&
          goldData?.source_data?.gold_price_usd_per_gram && (
            <>
              {goldData.source_data.market_data && (
                <div className="mt-8 flex flex-col md:flex-row justify-between items-center bg-white bg-opacity-30 rounded-lg p-6">
                  <div className="flex flex-col md:flex-row md:gap-4 gap-2 items-center">
                    <p className="text-sm text-gray-800">
                      Current Ounce Price (USD)
                    </p>
                    <p className="text-xl font-bold text-gray-900">
                      $
                      {goldData.source_data.market_data.current_price?.toFixed(
                        2
                      )}
                      {goldData.source_data.market_data.ch !== undefined && (
                        <span
                          className={`ml-3 text-lg font-semibold ${
                            goldData.source_data.market_data.ch >= 0
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {goldData.source_data.market_data.ch >= 0 ? "+" : ""}
                          {goldData.source_data.market_data.ch.toFixed(2)} (
                          {goldData.source_data.market_data.chp?.toFixed(2)}%)
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 text-center">
                    Data timestamp:&nbsp;
                    {new Date(
                      goldData.source_data.market_data.open_time
                    ).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full bg-white bg-opacity-30 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-yellow-600 text-white font-bold">
                      <th className="px-6 py-3 text-left text-xs uppercase tracking-wider">
                        Karat
                      </th>
                      <th className="px-6 py-3 text-right text-xs uppercase tracking-wider">
                        USD Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs uppercase tracking-wider">
                        {selectedCurrency} Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-yellow-200">
                    {Object.entries(
                      goldData.source_data.gold_price_usd_per_gram
                    ).map(([karat, priceUSD]) => (
                      <tr
                        key={karat}
                        className={`${
                          karatColors[karat as keyof typeof karatColors]
                        } bg-opacity-50 hover:bg-opacity-70 transition-colors border border-yellow-200 font-bold`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {karat} Gold
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          ${priceUSD.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {selectedCurrency}{" "}
                          {getPriceInSelectedCurrency(priceUSD)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {goldData.source_data.market_data?.silver_price !== undefined && (
                <div className="mt-4 flex flex-col md:flex-row md:gap-4 gap-2 items-center">
                  <p className="text-sm text-gray-800">
                    Silver Ounce Price (USD)
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    ${goldData.source_data.market_data.silver_price?.toFixed(2)}{" "}
                    {goldData.source_data.market_data.silver_change !==
                      undefined && (
                      <span
                        className={`text-lg font-semibold ${
                          goldData.source_data.market_data.silver_change >= 0
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {goldData.source_data.market_data.silver_change >= 0
                          ? "+"
                          : ""}
                        {goldData.source_data.market_data.silver_change.toFixed(
                          2
                        )}{" "}
                        (
                        {goldData.source_data.market_data.silver_change_percent?.toFixed(
                          2
                        )}
                        %)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </>
          )}

        {!loading && goldData?.source_data?.exchange_rates && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              Exchange Rates (1 X = {selectedCurrency})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Object.entries(goldData.source_data.exchange_rates)
                .filter(([currency]) => currency !== selectedCurrency)
                .map(([currency]) => (
                  <div
                    key={currency}
                    className="bg-white bg-opacity-30 p-3 rounded-lg text-center"
                  >
                    <p className="font-semibold text-gray-800">1 {currency}</p>
                    <p className="text-gray-700">
                      = {getExchangeRate(currency)} {selectedCurrency}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {!loading && goldData?.last_updated && (
          <p className="text-xs text-gray-700 mt-8 text-center">
            Last updated: {new Date(goldData.last_updated).toLocaleString()}
          </p>
        )}
      </div>

      <footer className="w-full max-w-4xl mt-10 text-center text-gray-200 text-sm">
        <p>
          Powered by Next.js & Tailwind CSS. Data fetched from live market APIs.
        </p>
        <p className="mt-1">
          Disclaimer: Prices are indicative and subject to real-time market
          fluctuations. Always consult a financial advisor for investment
          decisions.
        </p>
      </footer>
    </div>
  );
}
