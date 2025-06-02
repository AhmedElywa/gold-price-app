export const locales = [
  "ar",
  "de",
  "en",
  "es",
  "fr",
  "hi",
  "it",
  "ja",
  "ms",
  "nl",
  "rm",
  "ru",
  "ta",
  "tr",
  "zh",
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// Dictionary loader function
export async function getDictionary(locale: Locale) {
  try {
    const dictionary = await import(`../locales/${locale}.json`);
    return dictionary.default;
  } catch {
    console.warn(
      `Translation file not found for locale: ${locale}, falling back to English`
    );
    const englishDictionary = await import(`../locales/en.json`);
    return englishDictionary.default;
  }
}
