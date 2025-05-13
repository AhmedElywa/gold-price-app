import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add proper headers for service worker and JSON files
  const url = request.nextUrl.pathname;
  
  if (url === '/sw.js' || url === '/register-sw.js') {
    response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    response.headers.set('Service-Worker-Allowed', '/');
    response.headers.set('Content-Type', 'application/javascript; charset=utf-8');
  }
  
  if (url === '/manifest.json') {
    response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    response.headers.set('Content-Type', 'application/manifest+json; charset=utf-8');
  }
  
  // Add cross-origin isolation headers for better security
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  
  return response;
}

export const config = {
  matcher: [
    '/sw.js',
    '/register-sw.js',
    '/manifest.json',
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ],
}; 