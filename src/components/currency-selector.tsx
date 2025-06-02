"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign } from "lucide-react"

export function CurrencySelector() {
  return (
    <Select defaultValue="egp">
      <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
        <DollarSign className="w-4 h-4 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="egp">🇪🇬 Egypt (EGP)</SelectItem>
        <SelectItem value="usd">🇺🇸 USA (USD)</SelectItem>
        <SelectItem value="eur">🇪🇺 Europe (EUR)</SelectItem>
        <SelectItem value="gbp">🇬🇧 UK (GBP)</SelectItem>
        <SelectItem value="sar">🇸🇦 Saudi (SAR)</SelectItem>
        <SelectItem value="aed">🇦🇪 UAE (AED)</SelectItem>
      </SelectContent>
    </Select>
  )
}
