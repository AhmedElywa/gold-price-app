import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Head from 'next/head';
import PwaClientWrapper from './components/PwaClientWrapper';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: "Gold Price in Egypt",
  description: "Live gold prices in Egypt and around the world. Check the latest gold prices by karat and currency.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <title>Gold Price in Egypt</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <meta
          name="description"
          content="Live gold prices in Egypt and around the world. Check the latest gold prices by karat and currency."
        />
        <meta
          name="keywords"
          content="Gold Price, Egypt Gold Price, Gold Rate, Gold Karat, Gold Market, Gold Trading, Precious Metals, Gold Investment"
        />
        <meta
          name="og:title"
          property="og:title"
          content="Gold Price in Egypt"
        />
        <meta
          name="og:description"
          property="og:description"
          content="Live gold prices in Egypt and around the world. Check the latest gold prices by karat and currency."
        />
        <meta
          name="og:image"
          property="og:image"
          content="/icons/icon-512x512.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/icons/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/icons/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <PwaClientWrapper />
      </body>
    </html>
  );
}
