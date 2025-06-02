import { LanguageSelector } from "./language-selector"
import { CurrencySelector } from "./currency-selector"
import { TrendingUp } from "lucide-react"

export function Header() {
  return (
    <header className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-8 h-8" />
            <h1 className="text-2xl font-bold">GoldTracker Pro</h1>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <a href="#gold" className="hover:text-amber-200 transition-colors">
              Gold Prices
            </a>
            <a href="#silver" className="hover:text-amber-200 transition-colors">
              Silver Prices
            </a>
            <a href="#exchange" className="hover:text-amber-200 transition-colors">
              Exchange Rates
            </a>
            <a href="#about" className="hover:text-amber-200 transition-colors">
              About
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <LanguageSelector />
            <CurrencySelector />
          </div>
        </div>
      </div>
    </header>
  )
}
