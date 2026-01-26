'use client';

import { usePathname, useRouter } from 'next/navigation';
import type React from 'react';
import { createContext, useContext } from 'react';
import type { Locale } from '@/lib/i18n';

type TranslationKeys = {
  [key: string]: string | TranslationKeys;
};

interface TranslationContextValue {
  locale: Locale;
  dictionary: TranslationKeys;
  t: (key: string, params?: Record<string, string | number>) => string;
  changeLanguage: (newLocale: Locale) => void;
}

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined);

export function TranslationProvider({
  children,
  locale,
  dictionary,
}: {
  children: React.ReactNode;
  locale: Locale;
  dictionary: TranslationKeys;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: string | TranslationKeys = dictionary;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key} for locale: ${locale}`);
        return key;
      }
    }

    if (typeof value !== 'string') {
      console.warn(`Translation key "${key}" does not resolve to a string`);
      return key;
    }

    // Replace parameters in the translation string
    if (params) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value;
  };

  const changeLanguage = (newLocale: Locale) => {
    // For App Router, we need to navigate to the new locale URL
    const segments = pathname.split('/');

    // Replace the current locale (first segment after /) with new locale
    if (segments.length > 1 && segments[1].length === 2) {
      segments[1] = newLocale;
    } else {
      // If no locale in URL, add it
      segments.splice(1, 0, newLocale);
    }

    const newPath = segments.join('/');
    router.push(newPath);
  };

  const value: TranslationContextValue = {
    locale,
    dictionary,
    t,
    changeLanguage,
  };

  return <TranslationContext.Provider value={value}>{children}</TranslationContext.Provider>;
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
