export function getPriceInSelectedCurrency(
  priceUsd: number,
  exchangeRates: Record<string, number>,
  currency: string,
): number {
  if (currency === 'USD') return priceUsd;
  const rate = exchangeRates[currency] ?? 1;
  return priceUsd * rate;
}

export function formatPrice(price: number, currency: string, locale = 'en'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}
