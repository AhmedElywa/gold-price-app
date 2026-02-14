'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type React from 'react';
import { createContext, useCallback, useContext, useMemo } from 'react';
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
  const searchParams = useSearchParams();

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const keys = key.split('.');
      let value: string | TranslationKeys = dictionary;

      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          const next = value[k] as string | TranslationKeys | undefined;
          if (next === undefined) {
            console.warn(`Translation key not found: ${key} for locale: ${locale}`);
            return key;
          }
          value = next;
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
    },
    [dictionary, locale],
  );

  const changeLanguage = useCallback(
    (newLocale: Locale) => {
      const segments = pathname.split('/');

      if (segments.length > 1 && segments[1]?.length === 2) {
        segments[1] = newLocale;
      } else {
        segments.splice(1, 0, newLocale);
      }

      const newPath = segments.join('/');
      const query = searchParams.toString();
      router.push(query ? `${newPath}?${query}` : newPath);
    },
    [router, pathname, searchParams],
  );

  const contextValue = useMemo(
    () => ({ t, locale, changeLanguage, dictionary }),
    [t, locale, changeLanguage, dictionary],
  );

  return <TranslationContext.Provider value={contextValue}>{children}</TranslationContext.Provider>;
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
