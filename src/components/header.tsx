"use client";

import { LanguageSelector } from "./language-selector";
import { CurrencySelector } from "./currency-selector";
import { TrendingUp } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

export function Header() {
  const { t } = useTranslation();

  return (
    <header className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-8 h-8" />
            <h1 className="text-2xl font-bold">{t("app.brand")}</h1>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#gold" className="hover:text-amber-200 transition-colors">
              {t("navigation.goldPrices")}
            </a>
            <a
              href="#silver"
              className="hover:text-amber-200 transition-colors"
            >
              {t("navigation.silverPrices")}
            </a>
            <a
              href="#exchange"
              className="hover:text-amber-200 transition-colors"
            >
              {t("navigation.exchangeRates")}
            </a>
            <a href="#about" className="hover:text-amber-200 transition-colors">
              {t("navigation.about")}
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSelector />
            <CurrencySelector />
          </div>
        </div>
      </div>
    </header>
  );
}
