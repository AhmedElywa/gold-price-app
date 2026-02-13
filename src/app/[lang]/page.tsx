import { Suspense } from 'react';
import { ExchangeRates } from '@/components/exchange-rates';
import { Footer } from '@/components/footer';
import { GoldPrices } from '@/components/gold-prices';
import { Header } from '@/components/header';
import { JewelryCalculator } from '@/components/jewelry-calculator';
import { SilverPrices } from '@/components/silver-prices';
import { getSiteUrl } from '@/lib/site';

export default async function LandingPage({ params }: { params: Promise<{ lang: string }> }) {
  await params;

  let initialData = null;
  try {
    const baseUrl = getSiteUrl();
    const res = await fetch(`${baseUrl}/api/gold-prices-egp`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) initialData = await res.json();
  } catch {
    // Fail silently — components will fetch client-side
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      <Header />

      <main>
        <div className="animate-fade-in-up">
          <Suspense fallback={<div className="py-12 text-center text-[#8A8A8E]">Loading gold prices...</div>}>
            <GoldPrices initialData={initialData} />
          </Suspense>
        </div>
        <div className="animate-fade-in-up animation-delay-100">
          <Suspense fallback={<div className="py-12 text-center text-[#8A8A8E]">Loading silver prices...</div>}>
            <SilverPrices initialData={initialData} />
          </Suspense>
        </div>
        <div className="animate-fade-in-up animation-delay-200">
          <Suspense fallback={<div className="py-12 text-center text-[#8A8A8E]">Loading exchange rates...</div>}>
            <ExchangeRates initialData={initialData} />
          </Suspense>
        </div>
        <div className="animate-fade-in-up animation-delay-300">
          <Suspense fallback={<div className="py-12 text-center text-[#8A8A8E]">Loading calculator...</div>}>
            <JewelryCalculator initialData={initialData} />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}
