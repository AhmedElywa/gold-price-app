import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from 'next';
import { Geist, Geist_Mono, Playfair_Display } from 'next/font/google';
import { Suspense } from 'react';
import { defaultLocale, getDictionary, isValidLocale, type Locale, locales } from '@/lib/i18n';
import { getSiteUrl } from '@/lib/site';
import { TranslationProvider } from '../../components/translation-provider';
import BodyWrapper from '../components/BodyWrapper';
import '../globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const playfairDisplay = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '700', '900'],
});

// Generate static params for all supported locales
export async function generateStaticParams() {
  return locales.map((locale) => ({ lang: locale }));
}

// Generate metadata based on locale
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang: langParam } = await params;
  const lang: Locale = isValidLocale(langParam) ? langParam : defaultLocale;
  const dict = await getDictionary(lang);
  const siteUrl = getSiteUrl();
  const languageAlternates: Record<string, string> = Object.fromEntries(locales.map((localeCode) => [localeCode, `/${localeCode}`]));
  languageAlternates['x-default'] = `/${defaultLocale}`;

  return {
    title: dict.app.name,
    description: dict.app.description,
    keywords: dict.app.keywords,
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: `/${lang}`,
      languages: languageAlternates,
    },
    manifest: '/manifest.json',
    icons: {
      icon: '/icon.png',
      shortcut: '/favicon.ico',
      apple: '/apple-icon.png',
    },
    openGraph: {
      title: dict.app.name,
      description: dict.app.description,
      url: `${siteUrl}/${lang}`,
      locale: lang === 'ar' ? 'ar_EG' : 'en_US',
      images: [
        {
          url: '/icons/icon-512x512.png',
          width: 512,
          height: 512,
          alt: dict.app.name,
        },
      ],
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang: langParam } = await params;
  const lang: Locale = isValidLocale(langParam) ? langParam : defaultLocale;
  const dict = await getDictionary(lang);
  const isRTL = lang === 'ar';

  return (
    <html lang={lang} dir={isRTL ? 'rtl' : 'ltr'}>
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} antialiased`} suppressHydrationWarning>
        <Suspense>
          <TranslationProvider locale={lang} dictionary={dict}>
            <BodyWrapper>{children}</BodyWrapper>
          </TranslationProvider>
        </Suspense>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: dict.app.name,
            url: getSiteUrl(),
            inLanguage: lang === 'ar' ? 'ar' : 'en',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: dict.app.name,
            url: getSiteUrl(),
          }
        ]) }} />
        <Analytics />
      </body>
    </html>
  );
}
