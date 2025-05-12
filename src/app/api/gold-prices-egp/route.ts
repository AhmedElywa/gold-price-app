import { NextRequest, NextResponse } from "next/server";

// API Keys - Replace with environment variables in a real application
const GOLD_API_KEY = process.env.GOLD_API_KEY || "goldapi-1krp0wsmaku3jvz-io";
const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY || "8a1c727445b58fa524bf4df5";

// Cache implementation
let cache: {
  goldData: any;
  exchangeRates: any;
  timestamp: number;
} | null = null;

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

// TypeScript interfaces for API responses
interface GoldApiResponse {
  timestamp: number;
  metal: string;
  currency: string;
  exchange: string;
  symbol: string;
  prev_close_price: number;
  open_price: number;
  low_price: number;
  high_price: number;
  open_time: number;
  price: number;
  ch: number;
  chp: number;
  ask: number;
  bid: number;
  price_gram_24k: number;
  price_gram_22k: number;
  price_gram_21k: number;
  price_gram_20k: number;
  price_gram_18k: number;
  price_gram_16k: number;
  price_gram_14k: number;
  price_gram_10k: number;
}

interface ExchangeRateApiResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  conversion_rates: {
    [key: string]: number;
  };
}

// Interface for our API's response structure
interface ApiResponseData {
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

// Selected currencies to display (focusing on Arab countries and major currencies)
const SELECTED_CURRENCIES = [
  "EGP", // Egyptian Pound
  "SAR", // Saudi Riyal
  "AED", // UAE Dirham
  "QAR", // Qatari Riyal
  "KWD", // Kuwaiti Dinar
  "BHD", // Bahraini Dinar
  "OMR", // Omani Rial
  "JOD", // Jordanian Dinar
  "USD", // US Dollar
  "EUR", // Euro
  "GBP", // British Pound
  "JPY", // Japanese Yen
  "CNY", // Chinese Yuan
  "INR", // Indian Rupee
  "TRY", // Turkish Lira
  "RUB", // Russian Ruble
  "CAD", // Canadian Dollar
  "AUD", // Australian Dollar
  "CHF", // Swiss Franc
  "SGD", // Singapore Dollar
];

async function getGoldPriceUSDPerGram(): Promise<GoldApiResponse> {
  const url = `https://www.goldapi.io/api/XAU/USD`;
  try {
    const response = await fetch(url, {
      headers: {
        "x-access-token": GOLD_API_KEY,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`GoldAPI request failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}

async function getExchangeRates(): Promise<ExchangeRateApiResponse> {
  const url = `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/USD`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`ExchangeRate-API request failed: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check cache first
    const now = Date.now();
    if (cache && now - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.goldData);
    }

    const goldData = await getGoldPriceUSDPerGram();
    const exchangeRates = await getExchangeRates();

    // Filter exchange rates to only include selected currencies
    const filteredRates: { [key: string]: number } = {};
    SELECTED_CURRENCIES.forEach(currency => {
      if (exchangeRates.conversion_rates[currency]) {
        filteredRates[currency] = exchangeRates.conversion_rates[currency];
      }
    });

    const responseData: ApiResponseData = {
      source_data: {
        gold_price_usd_per_gram: {
          "24k": parseFloat(goldData.price_gram_24k.toFixed(2)),
          "22k": parseFloat(goldData.price_gram_22k.toFixed(2)),
          "21k": parseFloat(goldData.price_gram_21k.toFixed(2)),
          "20k": parseFloat(goldData.price_gram_20k.toFixed(2)),
          "18k": parseFloat(goldData.price_gram_18k.toFixed(2)),
          "16k": parseFloat(goldData.price_gram_16k.toFixed(2)),
          "14k": parseFloat(goldData.price_gram_14k.toFixed(2)),
          "10k": parseFloat(goldData.price_gram_10k.toFixed(2)),
        },
        exchange_rates: filteredRates,
      },
      gold_prices_egp_per_gram: {
        "24k": parseFloat((goldData.price_gram_24k * filteredRates.EGP).toFixed(2)),
        "22k": parseFloat((goldData.price_gram_22k * filteredRates.EGP).toFixed(2)),
        "21k": parseFloat((goldData.price_gram_21k * filteredRates.EGP).toFixed(2)),
        "20k": parseFloat((goldData.price_gram_20k * filteredRates.EGP).toFixed(2)),
        "18k": parseFloat((goldData.price_gram_18k * filteredRates.EGP).toFixed(2)),
        "16k": parseFloat((goldData.price_gram_16k * filteredRates.EGP).toFixed(2)),
        "14k": parseFloat((goldData.price_gram_14k * filteredRates.EGP).toFixed(2)),
        "10k": parseFloat((goldData.price_gram_10k * filteredRates.EGP).toFixed(2)),
      },
      last_updated: new Date().toISOString(),
    };

    // Update cache
    cache = {
      goldData: responseData,
      exchangeRates: filteredRates,
      timestamp: now,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    return NextResponse.json(
      { error: `Failed to process request: ${error.message}` },
      { status: 500 }
    );
  }
}
