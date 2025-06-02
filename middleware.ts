import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, defaultLocale, isValidLocale } from "./src/lib/i18n";

function getLocale(request: NextRequest): string {
  // Check if there is any supported locale in the pathname
  const { pathname } = request.nextUrl;
  const pathnameLocale = pathname.split("/")[1];

  if (isValidLocale(pathnameLocale)) {
    return pathnameLocale;
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    // Parse accept-language header and find best match
    const languages = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0].trim())
      .map((lang) => {
        // Handle both 'en-US' and 'en' formats
        if (lang.includes("-")) {
          return lang.split("-")[0];
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Don't process for static files, API routes, special Next.js paths, or root path
  if (
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname.startsWith("/sw.js") ||
    pathname.startsWith("/manifest.json") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml") ||
    pathname.startsWith("/icons/")
  ) {
    return NextResponse.next();
  }

  // Check if pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) {
    return NextResponse.next();
  }

  // For other paths without locale, redirect to add the detected locale
  const locale = getLocale(request);
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  return NextResponse.redirect(newUrl, 307); // Temporary redirect
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, etc.) but process other paths
    "/((?!_next|api|favicon.ico|sw.js|manifest.json|robots.txt|sitemap.xml|icons).*)",
  ],
};
