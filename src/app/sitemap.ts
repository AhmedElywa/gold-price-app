import type { MetadataRoute } from 'next';
import { defaultLocale } from '@/lib/i18n';
import { getSiteUrl } from '@/lib/site';

// Only include well-translated locales in the sitemap
const sitemapLocales = ['en', 'ar'] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const staticDate = new Date('2026-02-13');
  const contentRoutes = ['', '/about', '/privacy', '/terms', '/historical'];
  const urls: MetadataRoute.Sitemap = [];

  const buildAlternates = (route: string) =>
    Object.fromEntries([
      ...sitemapLocales.map((l) => [l, `${baseUrl}/${l}${route}`]),
      ['x-default', `${baseUrl}/${defaultLocale}${route}`],
    ]);

  for (const locale of sitemapLocales) {
    for (const route of contentRoutes) {
      urls.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: staticDate,
        changeFrequency: route ? 'weekly' : 'daily',
        priority: locale === defaultLocale && route === '' ? 1 : route === '' ? 0.9 : 0.8,
        alternates: { languages: buildAlternates(route) },
      });
    }
  }

  return urls;
}
