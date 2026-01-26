export interface KaratPrices {
  '24k': number;
  '22k': number;
  '21k': number;
  '20k': number;
  '18k': number;
  '16k': number;
  '14k': number;
  '10k': number;
}

export interface MarketData {
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
}

export interface SourceData {
  gold_price_usd_per_gram: KaratPrices;
  exchange_rates: Record<string, number>;
  market_data: MarketData;
}

export interface ApiResponseData {
  source_data: SourceData;
  gold_prices_egp_per_gram: KaratPrices;
  last_updated: string;
}

export interface CurrencyInfo {
  currency: string;
  flag: string;
  rate: string;
  change: string;
  trend: 'up' | 'down';
  name?: string;
}
