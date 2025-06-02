import { Header } from "@/components/header";
import { GoldPrices } from "@/components/gold-prices";
import { SilverPrices } from "@/components/silver-prices";
import { ExchangeRates } from "@/components/exchange-rates";
import { Footer } from "@/components/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      <Header />

      <main>
        <GoldPrices />
        <SilverPrices />
        <ExchangeRates />
      </main>

      <Footer />
    </div>
  );
}
