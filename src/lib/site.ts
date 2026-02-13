const FALLBACK_SITE_URL = 'https://gold.ahmedelywa.com';

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!fromEnv) {
    return FALLBACK_SITE_URL;
  }

  return fromEnv.replace(/\/+$/, '');
}
