import { Header } from "@/components/header";
import { GoldPrices } from "@/components/gold-prices";
import { SilverPrices } from "@/components/silver-prices";
import { ExchangeRates } from "@/components/exchange-rates";
import { Footer } from "@/components/footer";
import type { Locale } from "@/lib/i18n";
import { Suspense } from "react";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  // We don't need to use lang directly in this component
  // since translations are provided through the context
  await params;

  return (
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
  );
}
