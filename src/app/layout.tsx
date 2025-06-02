import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | GoldTracker Pro",
    default: "GoldTracker Pro",
  },
  description: "Live gold prices and currency exchange rates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
