/**
 * Gold + FX API proxy (Next.js Route Handler)
 *
 * Uses the public JSON feed from goldprice.org (no key, no request limits)
 *   • Endpoint: https://data-asg.goldprice.org/dbXRates/USD
 * Provides XAU‑USD ounce price. We convert to per‑gram prices and
 * build karat tables.  Daily OHLC not available → we mirror the current
 * price across open/high/low/prev‑close so the UI stays happy.
 *
 * Exchange rates come from ExchangeRate‑API (free 1 500 calls / month).
 */

import { NextResponse } from "next/server";

/** troy‑ounce → gram */
const OUNCE_TO_GRAM = 31.1034768;
/** 30‑minute cache for FX rates only */
const FX_CACHE_MS = 30 * 60 * 1000;
interface FxCache {
  rates: Record<string, number>;
  ts: number;
}
let fxCache: FxCache | null = null;

/* ---------- response shape (unchanged for React client) ------------- */
interface ApiResponseData {
  source_data: {
    gold_price_usd_per_gram: Record<
      "24k" | "22k" | "21k" | "20k" | "18k" | "16k" | "14k" | "10k",
      number
    >;
    exchange_rates: Record<string, number>;
    market_data: {
      current_price: number;
      prev_close_price?: number;
      ch?: number;
      chp?: number;
      silver_price?: number;
      silver_change?: number;
      silver_change_percent?: number;
      open_time: number;
      exchange: string;
      symbol: string;
    };
  };
  gold_prices_egp_per_gram: Record<
    "24k" | "22k" | "21k" | "20k" | "18k" | "16k" | "14k" | "10k",
    number
  >;
  last_updated: string;
}

/* ---------- helpers -------------------------------------------------- */
function karatPricesFromOunce(ounceUsd: number) {
  const g24 = ounceUsd / OUNCE_TO_GRAM;
  const k = (n: number) => parseFloat(((g24 * n) / 24).toFixed(2));
  return {
    "24k": parseFloat(g24.toFixed(2)),
    "22k": k(22),
    "21k": k(21),
    "20k": k(20),
    "18k": k(18),
    "16k": k(16),
    "14k": k(14),
    "10k": k(10),
  };
}

/* ---------- goldprice.org fetch ------------------------------------- */
async function fetchOuncePriceUSD(): Promise<{
  ounce: number;
  xagPrice: number;
  chgXau: number;
  chgXag: number;
  pcXau: number;
  pcXag: number;
  xauClose: number;
  ts: number;
}> {
  const res = await fetch("https://data-asg.goldprice.org/dbXRates/USD", {
    next: { revalidate: 60 }, // optional cache hint for Next.js
  });
  if (!res.ok) throw new Error(`goldprice.org HTTP ${res.status}`);
  const j = await res.json();
  const ounce = j?.items?.[0]?.xauPrice;
  if (!ounce) throw new Error("XAU price not found in payload");
  const ts = j?.ts ?? Date.now();
  return {
    ounce: parseFloat(ounce),
    xagPrice: parseFloat(j?.items?.[0]?.xagPrice ?? 0),
    chgXau: parseFloat(j?.items?.[0]?.chgXau ?? 0),
    chgXag: parseFloat(j?.items?.[0]?.chgXag ?? 0),
    pcXau: parseFloat(j?.items?.[0]?.pcXau ?? 0),
    pcXag: parseFloat(j?.items?.[0]?.pcXag ?? 0),
    xauClose: parseFloat(j?.items?.[0]?.xauClose ?? ounce),
    ts,
  };
}

/* ---------- Exchange‑Rate API --------------------------------------- */
const EXCHANGE_RATE_API_KEY =
  process.env.EXCHANGE_RATE_API_KEY ?? "8a1c727445b58fa524bf4df5";

const SELECTED_CURRENCIES = [
  "EGP",
  "SAR",
  "AED",
  "QAR",
  "KWD",
  "BHD",
  "OMR",
  "JOD",
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CNY",
  "INR",
  "TRY",
  "RUB",
  "CAD",
  "AUD",
  "CHF",
  "SGD",
] as const;

async function fetchFxRates() {
  const now = Date.now();
  if (fxCache && now - fxCache.ts < FX_CACHE_MS) {
    return fxCache.rates;
  }

  const url = `https://v6.exchangerate-api.com/v6/${EXCHANGE_RATE_API_KEY}/latest/USD`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ExchangeRate-API HTTP ${res.status}`);
  const j = await res.json();
  const filtered: Record<string, number> = {};
  SELECTED_CURRENCIES.forEach((c) => {
    if (j.conversion_rates[c]) filtered[c] = j.conversion_rates[c];
  });

  fxCache = { rates: filtered, ts: now };
  return filtered;
}

/* ---------- route handler ------------------------------------------- */
export async function GET() {
  try {
    const {
      ounce,
      xagPrice,
      chgXau,
      chgXag,
      pcXau,
      pcXag,
      xauClose,
      ts,
    } = await fetchOuncePriceUSD();
    const fxRates = await fetchFxRates();

    const goldGramUSD = karatPricesFromOunce(ounce);
    const goldGramEGP = karatPricesFromOunce(ounce * fxRates["EGP"]);

    const payload: ApiResponseData = {
      source_data: {
        gold_price_usd_per_gram: goldGramUSD,
        exchange_rates: fxRates,
        market_data: {
          current_price: ounce,
          prev_close_price: xauClose,
          ch: chgXau,
          chp: pcXau,
          silver_price: xagPrice,
          silver_change: chgXag,
          silver_change_percent: pcXag,
          open_time: ts,
          exchange: "goldprice.org",
          symbol: "XAUUSD",
        },
      },
      gold_prices_egp_per_gram: goldGramEGP,
      last_updated: new Date(fxCache?.ts ?? Date.now()).toISOString(),
    };

    return NextResponse.json(payload);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json(
      { error: `Failed to fetch gold data: ${msg}` },
      { status: 500 }
    );
  }
}
