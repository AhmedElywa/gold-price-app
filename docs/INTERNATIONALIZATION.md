# Multi-Language Setup for Gold Price App (App Router)

This document explains how to use the internationalization (i18n) system implemented in the Gold Price App using Next.js App Router.

## 🌍 Supported Languages

- **Arabic (ar)** - العربية
- **German (de)** - Deutsch
- **English (en)** - Default language
- **Spanish (es)** - Español
- **French (fr)** - Français
- **Hindi (hi)** - हिन्दी
- **Italian (it)** - Italiano
- **Japanese (ja)** - 日本語
- **Malay (ms)** - Bahasa Melayu
- **Dutch (nl)** - Nederlands
- **Romansh (rm)** - Rumantsch
- **Russian (ru)** - Русский
- **Tamil (ta)** - தமிழ்
- **Turkish (tr)** - Türkçe
- **Chinese Simplified (zh)** - 中文

## 📁 File Structure

```
src/
├── app/
│   ├── [lang]/                    # Dynamic locale route
│   │   ├── layout.tsx            # Locale-specific layout
│   │   └── page.tsx              # Locale-specific pages
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Root page (redirects to default locale)
│   └── globals.css               # Global styles
├── lib/
│   └── i18n.ts                   # i18n configuration and utilities
├── locales/
│   ├── ar.json                   # Arabic translations
│   ├── de.json                   # German translations
│   ├── en.json                   # English translations
│   ├── es.json                   # Spanish translations
│   ├── fr.json                   # French translations
│   ├── hi.json                   # Hindi translations
│   ├── it.json                   # Italian translations
│   ├── ja.json                   # Japanese translations
│   ├── ms.json                   # Malay translations
│   ├── nl.json                   # Dutch translations
│   ├── rm.json                   # Romansh translations
│   ├── ru.json                   # Russian translations
│   ├── ta.json                   # Tamil translations
│   ├── tr.json                   # Turkish translations
│   └── zh.json                   # Chinese translations
├── components/
│   ├── translation-provider.tsx  # Translation context provider
│   └── language-selector.tsx     # Language switcher
├── hooks/
│   └── useTranslation.ts         # Translation hook (re-export)
└── middleware.ts                 # Locale detection and routing
```

## 🚀 Usage

### Basic Translation

```tsx
import { useTranslation } from "@/hooks/useTranslation";

export function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t("app.name")}</h1>
      <p>{t("app.description")}</p>
    </div>
  );
}
```

### Translation with Parameters

```tsx
const { t } = useTranslation();

// For strings like "© {year} GoldTracker Pro. All rights reserved."
const copyrightText = t("footer.copyright", { year: new Date().getFullYear() });

// For strings like "(Gold is {ratio}x more expensive)"
const ratioText = t("silver.goldExpensive", { ratio: 75 });
```

### Language Switching

```tsx
import { useTranslation } from "@/hooks/useTranslation";

export function LanguageSwitcher() {
  const { locale, changeLanguage } = useTranslation();

  return (
    <select value={locale} onChange={(e) => changeLanguage(e.target.value)}>
      <option value="ar">العربية</option>
      <option value="de">Deutsch</option>
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="fr">Français</option>
      <option value="hi">हिन्दी</option>
      <option value="it">Italiano</option>
      <option value="ja">日本語</option>
      <option value="ms">Bahasa Melayu</option>
      <option value="nl">Nederlands</option>
      <option value="rm">Rumantsch</option>
      <option value="ru">Русский</option>
      <option value="ta">தமிழ்</option>
      <option value="tr">Türkçe</option>
      <option value="zh">中文</option>
    </select>
  );
}
```

## 📝 Translation Keys Structure

The translation files are organized hierarchically:

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error"
  },
  "app": {
    "name": "Gold Price in Egypt",
    "brand": "GoldTracker Pro"
  },
  "navigation": {
    "goldPrices": "Gold Prices",
    "silverPrices": "Silver Prices"
  },
  "gold": {
    "title": "Precious Metals Exchange",
    "karats": {
      "24k": "24k Gold",
      "22k": "22k Gold"
    }
  }
}
```

## 🔧 App Router Configuration

### Middleware Configuration

The app uses middleware for locale detection and routing in `middleware.ts`:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale, isValidLocale } from "./src/lib/i18n";

export function middleware(request: NextRequest) {
  // Detect locale and redirect if necessary
  // ...
}

export const config = {
  matcher: [
    "/((?!_next|api|favicon.ico|sw.js|manifest.json|robots.txt|sitemap.xml|icons).*)",
  ],
};
```

### i18n Configuration in `src/lib/i18n.ts`:

```typescript
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

export async function getDictionary(locale: Locale) {
  // Load translation file
}
```

### Layout Configuration in `src/app/[lang]/layout.tsx`:

```typescript
export async function generateStaticParams() {
  return locales.map((locale) => ({ lang: locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale };
}) {
  const dict = await getDictionary(params.lang);
  return {
    title: dict.app.name,
    description: dict.app.description,
  };
}
```

## 🌐 URL Structure

App Router automatically handles URL localization with the `[lang]` dynamic route:

- `/en` - English (default)
- `/ar` - Arabic version
- `/de` - German version
- `/es` - Spanish version
- `/fr` - French version
- `/hi` - Hindi version
- `/it` - Italian version
- `/ja` - Japanese version
- `/ms` - Malay version
- `/nl` - Dutch version
- `/rm` - Romansh version
- `/ru` - Russian version
- `/ta` - Tamil version
- `/tr` - Turkish version
- `/zh` - Chinese version

## 🔄 How It Works

1. **Middleware Detection**: The middleware detects the user's preferred language from the URL or Accept-Language header
2. **Dynamic Routing**: The `[lang]` directory creates dynamic routes for each locale
3. **Static Generation**: `generateStaticParams()` pre-generates pages for all locales
4. **Translation Provider**: The `TranslationProvider` makes translations available via React Context
5. **Translation Hook**: Components use `useTranslation()` to access translations

## 📱 RTL Support

For RTL languages like Arabic, the layout can be configured:

```tsx
export default async function LangLayout({ params, children }) {
  const { lang } = await params;
  const isRTL = lang === "ar";

  return (
    <html lang={lang} dir={isRTL ? "rtl" : "ltr"}>
      <body>{children}</body>
    </html>
  );
}
```

## 🎯 Translation Categories

### Core App Text

- `app.*` - App name, description, branding
- `navigation.*` - Menu items and links

### Content Sections

- `gold.*` - Gold prices section
- `silver.*` - Silver prices section
- `exchange.*` - Exchange rates section

### UI Elements

- `common.*` - Buttons, loading states, errors
- `currencies.*` - Currency names and symbols
- `notifications.*` - Push notification messages
- `pwa.*` - Progressive Web App install prompts

### Static Content

- `footer.*` - Footer links and contact info
- `languages.*` - Language names for selector

## 🔄 Adding New Translations

1. Add the key to `src/locales/en.json`
2. Add translations to all other language files
3. Use the key in your component: `t('category.key')`

## 💡 Best Practices

1. **Use descriptive keys**: `gold.tableHeaders.karat` instead of `karat`
2. **Group related translations**: Keep all gold-related text under `gold.*`
3. **Use parameters for dynamic content**: `{currency}`, `{year}`, `{ratio}`
4. **Test all languages**: Ensure UI looks good in all supported languages
5. **Consider text length**: Some languages are longer than others
6. **Static Generation**: Use `generateStaticParams()` for better performance

## 🐛 Troubleshooting

- **Missing translation warning**: Check console for missing keys
- **Fallback to English**: App automatically falls back if translation missing
- **Locale not found**: Check that the locale is included in the `locales` array
- **Middleware not working**: Verify the matcher pattern excludes static files

## 📊 All Available Translation Keys

See the individual `.json` files in `src/locales/` for the complete list of available translation keys.
