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
    title: `${dict.about.title} | ${dict.app.brand}`,
    description: dict.about.description,
    alternates: {
      canonical: `/${locale}/about`,
      languages: {
        en: '/en/about',
        ar: '/ar/about',
        'x-default': '/en/about',
      },
    },
  };
}

export default async function AboutPage({ params }: PageProps) {
  const locale = await resolveLocale(params);
  const dict = await getDictionary(locale);

  return (
    <main className="container mx-auto px-4 py-12">
      <section className="max-w-4xl mx-auto bg-white rounded-xl shadow p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{dict.about.title}</h1>
        <p className="text-gray-700 mb-4">{dict.about.content}</p>
        <p className="text-gray-700">
          <Link href={`/${locale}`} className="text-amber-600 hover:text-amber-700 underline">
            Return to live prices
          </Link>
        </p>
      </section>
    </main>
  );
}
