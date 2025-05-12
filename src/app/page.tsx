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
    console.log("fetchGoldPrices: Starting fetch...");
    try {
      setLoading(true);
      setError(null);
      console.log("fetchGoldPrices: About to fetch /api/gold-prices-egp");
      const response = await fetch("/api/gold-prices-egp");
      console.log(
        "fetchGoldPrices: Fetch response received, status:",
        response.status
      );

      if (!response.ok) {
        console.error(
          "fetchGoldPrices: Response not OK, status:",
          response.status
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("fetchGoldPrices: Response OK, about to parse JSON.");
      const data = await response.json();
      console.log("fetchGoldPrices: JSON parsed, data:", data);
      
      // Debug log to check data structure
      console.log("Data structure:", {
        hasSourceData: !!data.source_data,
        hasGoldPrices: !!data.source_data?.gold_price_usd_per_gram,
        hasExchangeRates: !!data.source_data?.exchange_rates,
        goldPrices: data.source_data?.gold_price_usd_per_gram,
        exchangeRates: data.source_data?.exchange_rates
      });

      setGoldData(data);
      console.log("fetchGoldPrices: goldData state updated.");
    } catch (e: any) {
      console.error("fetchGoldPrices: Error caught:", e.message, e);
      setError(
        e.message || "Failed to load gold prices. Please try again later."
      );
      setGoldData(null);
    } finally {
      console.log("fetchGoldPrices: Finally block, setting loading to false.");
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchGoldPrices(); // Initial fetch
    const interval = setInterval(() => {
      console.log("fetchGoldPrices: Interval triggered, fetching new data...");
      fetchGoldPrices();
    }, 300000); // 300,000 ms = 5 minutes

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  const getPriceInSelectedCurrency = (priceUSD: number) => {
    if (!goldData?.source_data?.exchange_rates) return 0;
    const rate = goldData.source_data.exchange_rates[selectedCurrency];
    return parseFloat((priceUSD * rate).toFixed(2));
  };

  const karatColors = {
    "24k": "bg-yellow-500",
    "22k": "bg-yellow-400",
    "21k": "bg-yellow-300",
    "20k": "bg-yellow-200",
    "18k": "bg-amber-400",
    "16k": "bg-amber-300",
    "14k": "bg-amber-200",
    "10k": "bg-orange-300",
  };

  // Don't render anything until the component is mounted
  if (!mounted) {
    return null;
  }

  // Debug render to check data
  console.log("Render state:", {
    loading,
    error,
    hasGoldData: !!goldData,
    hasSourceData: !!goldData?.source_data,
    hasGoldPrices: !!goldData?.source_data?.gold_price_usd_per_gram,
    hasExchangeRates: !!goldData?.source_data?.exchange_rates
  });

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
                {Object.keys(goldData.source_data.exchange_rates).map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
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

        {!loading && !error && goldData?.source_data?.gold_price_usd_per_gram && (
          <div className="overflow-x-auto">
            <table className="w-full bg-white bg-opacity-30 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-yellow-600 text-white">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Karat
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    USD Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    {selectedCurrency} Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-yellow-200">
                {Object.entries(goldData.source_data.gold_price_usd_per_gram).map(
                  ([karat, priceUSD]) => (
                    <tr
                      key={karat}
                      className={`${karatColors[karat as keyof typeof karatColors]} bg-opacity-50 hover:bg-opacity-70 transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {karat} Gold
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        ${priceUSD.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {selectedCurrency} {getPriceInSelectedCurrency(priceUSD)}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && goldData?.source_data?.exchange_rates && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
              Exchange Rates
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Object.entries(goldData.source_data.exchange_rates).map(
                ([currency, rate]) => (
                  <div
                    key={currency}
                    className="bg-white bg-opacity-30 p-3 rounded-lg text-center"
                  >
                    <p className="font-semibold text-gray-800">{currency}</p>
                    <p className="text-gray-700">{rate.toFixed(4)}</p>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {!loading && goldData?.last_updated && (
          <p className="text-xs text-gray-700 mt-8 text-center">
            Last updated: {new Date(goldData.last_updated).toLocaleString()}
          </p>
        )}

        {/* Debug information */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-4 bg-gray-800 bg-opacity-50 rounded-lg text-xs text-gray-300">
            <pre>
              {JSON.stringify({
                loading,
                error,
                hasGoldData: !!goldData,
                hasSourceData: !!goldData?.source_data,
                hasGoldPrices: !!goldData?.source_data?.gold_price_usd_per_gram,
                hasExchangeRates: !!goldData?.source_data?.exchange_rates,
                selectedCurrency,
                goldPrices: goldData?.source_data?.gold_price_usd_per_gram,
                exchangeRates: goldData?.source_data?.exchange_rates
              }, null, 2)}
            </pre>
          </div>
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
