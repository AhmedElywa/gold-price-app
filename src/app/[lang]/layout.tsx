import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  locales,
  getDictionary,
  isValidLocale,
  defaultLocale,
  type Locale,
} from "@/lib/i18n";
import { TranslationProvider } from "../../components/translation-provider";
import BodyWrapper from "../components/BodyWrapper";
import { Analytics } from "@vercel/analytics/next";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Generate static params for all supported locales
export async function generateStaticParams() {
  return locales.map((locale) => ({ lang: locale }));
}

// Generate metadata based on locale
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: langParam } = await params;
  const lang: Locale = isValidLocale(langParam) ? langParam : defaultLocale;
  const dict = await getDictionary(lang);

  return {
    title: dict.app.name,
    description: dict.app.description,
    keywords: dict.app.keywords,
    metadataBase: new URL("https://gold.ahmedelywa.com"), // Your actual domain
    manifest: "/manifest.json",
    icons: {
      icon: "/icon.png",
      shortcut: "/favicon.ico",
      apple: "/apple-icon.png",
    },
    openGraph: {
      title: dict.app.name,
      description: dict.app.description,
      images: [
        {
          url: "/icons/icon-512x512.png",
          width: 512,
          height: 512,
          alt: dict.app.name,
        },
      ],
    },
  };
}

export default async function LangLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang: langParam } = await params;
  const lang: Locale = isValidLocale(langParam) ? langParam : defaultLocale;
  const dict = await getDictionary(lang);
  const isRTL = lang === "ar";

  return (
    <html lang={lang} dir={isRTL ? "rtl" : "ltr"}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <TranslationProvider locale={lang} dictionary={dict}>
          <BodyWrapper>{children}</BodyWrapper>
        </TranslationProvider>
        <Analytics />
      </body>
    </html>
  );
}
