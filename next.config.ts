import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,

  // Suppress hydration errors in production
  onDemandEntries: {
    // Keep unused pages in memory for longer so hydration warnings are less likely
    maxInactiveAge: 25 * 1000,
    // Make page boundaries less strict for smoother development
    pagesBufferLength: 4,
  },

  // Allow local network dev access
  allowedDevOrigins: ['http://localhost:3000', 'http://192.168.1.2:3000'],

  // Security headers
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    const cspValue = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "connect-src 'self' https://data-asg.goldprice.org https://v6.exchangerate-api.com",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join('; ');

    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: cspValue,
          },
        ],
      },

      {
        source: '/api/sw',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
