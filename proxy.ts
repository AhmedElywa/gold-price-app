import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { defaultLocale, isValidLocale, locales } from './src/lib/i18n';

function getLocale(request: NextRequest): string {
  // Check if there is any supported locale in the pathname
  const { pathname } = request.nextUrl;
  const pathnameLocale = pathname.split('/')[1] ?? '';

  if (isValidLocale(pathnameLocale)) {
    return pathnameLocale;
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    // Parse accept-language header and find best match
    const languages = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0]?.trim() ?? '')
      .map((lang) => {
        // Handle both 'en-US' and 'en' formats
        if (lang.includes('-')) {
          return lang.split('-')[0] ?? lang;
        }
        return lang;
      });

    for (const lang of languages) {
      if (isValidLocale(lang)) {
        return lang;
      }
    }
  }

  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Don't process for static files, API routes, special Next.js paths, or root path
  if (
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/sw.js') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/robots.txt') ||
    pathname.startsWith('/sitemap.xml') ||
    pathname.startsWith('/icons/')
  ) {
    const response = NextResponse.next();

    // Add proper headers for service worker and JSON files
    if (pathname === '/api/sw' || pathname === '/register-sw.js') {
      response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
      response.headers.set('Service-Worker-Allowed', '/');
      response.headers.set('Content-Type', 'application/javascript; charset=utf-8');
    }

    if (pathname === '/manifest.json') {
      response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
      response.headers.set('Content-Type', 'application/manifest+json; charset=utf-8');
    }

    // Add cross-origin isolation headers for better security
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');

    return response;
  }

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`);

  if (pathnameHasLocale) {
    const response = NextResponse.next();
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    return response;
  }

  // For other paths without locale, redirect to add the detected locale
  const locale = getLocale(request);
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  return NextResponse.redirect(newUrl, 307); // Temporary redirect
}

export const config = {
  matcher: [
    // Skip all internal paths (_next) but process other paths
    '/((?!_next|favicon.ico|icons).*)',
  ],
};
