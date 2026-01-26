import type { MetadataRoute } from 'next';
import { locales } from '@/lib/i18n';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://gold.ahmedelywa.com'; // Replace with your actual domain

  // Generate sitemap entries for all locales
  const urls: MetadataRoute.Sitemap = [];

  // Define all available currencies
  const currencies = [
    // Primary currencies
    'egp',
    'usd',
    'eur',
    // Major currencies
    'gbp',
    'jpy',
    'cny',
    'inr',
    'try',
    'rub',
    'cad',
    'aud',
    'chf',
    'sgd',
    // GCC currencies
    'sar',
    'aed',
    'qar',
    'kwd',
    'bhd',
    'omr',
    'jod',
  ];

  locales.forEach((locale) => {
    // Add base locale URL
    urls.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: locale === 'en' ? 1 : 0.9,
    });

    // Add currency-specific URLs for each locale
    currencies.forEach((currency) => {
      urls.push({
        url: `${baseUrl}/${locale}?currency=${currency.toUpperCase()}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: locale === 'en' ? 0.8 : 0.7,
      });
    });
  });

  return urls;
}
