import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
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
  metadataBase: new URL('https://gold-price-app.vercel.app'), // Replace with your actual domain
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: "Gold Price in Egypt",
    description: "Live gold prices in Egypt and around the world. Check the latest gold prices by karat and currency.",
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'Gold Price in Egypt',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <PwaClientWrapper />
      </body>
    </html>
  );
}
