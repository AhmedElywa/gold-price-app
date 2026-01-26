import { Analytics } from '@vercel/analytics/next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Suspense } from 'react';
import { ExchangeRates } from '@/components/exchange-rates';
import { Footer } from '@/components/footer';
import { GoldPrices } from '@/components/gold-prices';
import { Header } from '@/components/header';
import { SilverPrices } from '@/components/silver-prices';
import { TranslationProvider } from '@/components/translation-provider';
import { defaultLocale, getDictionary } from '@/lib/i18n';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default async function RootPage() {
  // Use the default locale (English) for the root page
  const dict = await getDictionary(defaultLocale);

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <TranslationProvider locale={defaultLocale} dictionary={dict}>
          <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
            <Header />

            <main>
              <Suspense fallback={<div className="py-12 text-center">Loading gold prices...</div>}>
                <GoldPrices />
              </Suspense>
              <Suspense fallback={<div className="py-12 text-center">Loading silver prices...</div>}>
                <SilverPrices />
              </Suspense>
              <Suspense fallback={<div className="py-12 text-center">Loading exchange rates...</div>}>
                <ExchangeRates />
              </Suspense>
            </main>

            <Footer />
          </div>
        </TranslationProvider>
        <Analytics />
      </body>
    </html>
  );
}
