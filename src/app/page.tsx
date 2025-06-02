import { Header } from "@/components/header";
import { GoldPrices } from "@/components/gold-prices";
import { SilverPrices } from "@/components/silver-prices";
import { ExchangeRates } from "@/components/exchange-rates";
import { Footer } from "@/components/footer";
import { defaultLocale, getDictionary } from "@/lib/i18n";
import { TranslationProvider } from "@/components/translation-provider";
import { Suspense } from "react";

export default async function RootPage() {
  // Use the default locale (English) for the root page
  const dict = await getDictionary(defaultLocale);

  return (
    <TranslationProvider locale={defaultLocale} dictionary={dict}>
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
        <Header />

        <main>
          <Suspense
            fallback={
              <div className="py-12 text-center">Loading gold prices...</div>
            }
          >
            <GoldPrices />
          </Suspense>
          <Suspense
            fallback={
              <div className="py-12 text-center">Loading silver prices...</div>
            }
          >
            <SilverPrices />
          </Suspense>
          <Suspense
            fallback={
              <div className="py-12 text-center">Loading exchange rates...</div>
            }
          >
            <ExchangeRates />
          </Suspense>
        </main>

        <Footer />
      </div>
    </TranslationProvider>
  );
}
