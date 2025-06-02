"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Activity, Zap, Loader2 } from "lucide-react";
import { useGoldData } from "@/hooks/useGoldData";

export function SilverPrices() {
  const { data, loading, error } = useGoldData();

  if (loading) {
    return (
      <section
        id="silver"
        className="py-12 bg-gradient-to-br from-slate-50 to-gray-100"
      >
        <div className="container mx-auto px-4">
          <Card className="bg-white shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading silver prices...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section
        id="silver"
        className="py-12 bg-gradient-to-br from-slate-50 to-gray-100"
      >
        <div className="container mx-auto px-4">
          <Card className="bg-white shadow-xl">
            <CardContent className="p-6">
              <div className="text-center text-gray-500">
                Unable to load silver prices data
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  const marketData = data.source_data.market_data;
  const silverPrice = marketData.silver_price ?? 0;
  const silverChange = marketData.silver_change ?? 0;
  const silverChangePercent = marketData.silver_change_percent ?? 0;

  const isSilverPositive = silverChange >= 0;

  // Calculate gold to silver ratio
  const goldToSilverRatio =
    silverPrice > 0 ? marketData.current_price / silverPrice : 0;

  // Generate different silver product prices based on spot price
  const silverProducts = [
    {
      type: "Silver Spot",
      price: `$${silverPrice.toFixed(2)}`,
      change: `${isSilverPositive ? "+" : ""}${silverChange.toFixed(2)}`,
      percentage: `(${silverChangePercent.toFixed(2)}%)`,
      trend: isSilverPositive ? "up" : "down",
    },
    {
      type: "Silver Coins",
      price: `$${(silverPrice * 1.075).toFixed(2)}`, // 7.5% premium
      change: `${isSilverPositive ? "+" : ""}${(silverChange * 1.075).toFixed(
        2
      )}`,
      percentage: `(${silverChangePercent.toFixed(2)}%)`,
      trend: isSilverPositive ? "up" : "down",
    },
    {
      type: "Silver Bars",
      price: `$${(silverPrice * 1.007).toFixed(2)}`, // 0.7% premium
      change: `${isSilverPositive ? "+" : ""}${(silverChange * 1.007).toFixed(
        2
      )}`,
      percentage: `(${silverChangePercent.toFixed(2)}%)`,
      trend: isSilverPositive ? "up" : "down",
    },
    {
      type: "Silver Jewelry",
      price: `$${(silverPrice * 1.175).toFixed(2)}`, // 17.5% premium
      change: `${isSilverPositive ? "+" : ""}${(silverChange * 1.175).toFixed(
        2
      )}`,
      percentage: `(${silverChangePercent.toFixed(2)}%)`,
      trend: isSilverPositive ? "up" : "down",
    },
  ];

  return (
    <section
      id="silver"
      className="py-12 bg-gradient-to-br from-slate-50 to-gray-100"
    >
      <div className="container mx-auto px-4">
        <Card className="bg-white shadow-xl">
          <CardHeader className="bg-gradient-to-r from-slate-100 to-gray-100 border-b">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800 mb-2">
                  Silver Market Center
                </CardTitle>
                <p className="text-gray-600">
                  Industrial & Investment Grade • Real-time Pricing
                </p>
              </div>

              <div className="flex items-center space-x-4 mt-4 lg:mt-0">
                <div className="bg-white rounded-lg px-3 py-2 shadow-sm">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Market Active</span>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Zap className="w-4 h-4 mr-2" />
                  Set Alert
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {silverProducts.map((item, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-lg p-4 border"
                >
                  <div className="text-center">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      {item.type}
                    </h3>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {item.price}
                    </div>
                    <div
                      className={`flex items-center justify-center space-x-1 ${
                        item.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {item.trend === "up" ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="text-sm font-medium">
                        {item.change} {item.percentage}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">
                    Silver vs Gold Ratio
                  </h4>
                  <p className="text-sm text-gray-600">
                    Current ratio: 1:{goldToSilverRatio.toFixed(2)} (Gold is{" "}
                    {goldToSilverRatio.toFixed(0)}x more expensive)
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">
                    {goldToSilverRatio.toFixed(2)}
                  </div>
                  <div
                    className={`text-sm ${
                      isSilverPositive ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {silverChangePercent > 0 ? "+" : ""}
                    {silverChangePercent.toFixed(1)}% today
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
