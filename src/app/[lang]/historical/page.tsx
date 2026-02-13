import type { Metadata } from 'next';
import Link from 'next/link';
import { defaultLocale, getDictionary, isValidLocale } from '@/lib/i18n';

type PageProps = {
  params: Promise<{ lang: string }>;
};

async function resolveLocale(params: Promise<{ lang: string }>) {
  const { lang } = await params;
  return isValidLocale(lang) ? lang : defaultLocale;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = await getDictionary(locale);
  return {
    title: `${dict.historical.title} | ${dict.app.brand}`,
    description: dict.historical.description,
    alternates: {
      canonical: `/${locale}/historical`,
      languages: {
        en: '/en/historical',
        ar: '/ar/historical',
        'x-default': '/en/historical',
      },
    },
  };
}

export default async function HistoricalPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const dict = await getDictionary(locale);

  return (
    <main className="container mx-auto px-4 py-12">
      <section className="max-w-4xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{dict.historical.title}</h1>
        <p className="text-gray-700 mb-4">{dict.historical.content}</p>
        <ul className="list-disc ps-6 text-gray-700 space-y-2 mb-4">
          <li>Multi-range charts (1D, 1W, 1M, 6M, 1Y)</li>
          <li>High and low summaries</li>
          <li>Export-ready history view</li>
        </ul>
        <p className="text-gray-700">
          <Link href={`/${locale}`} className="text-amber-600 hover:text-amber-700 underline">
            Return to live prices
          </Link>
        </p>
      </section>
    </main>
  );
}
