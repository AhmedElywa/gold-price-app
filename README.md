# Gold Price App

A small Next.js PWA that tracks gold prices and can send push notifications when the price changes significantly.

## Setup

1. Generate VAPID keys:
   ```bash
   npx web-push generate-vapid-keys --json
   ```
   Copy the `publicKey` and `privateKey` values.

2. Create a `.env.local` file based on `.env.example` and set:
   ```bash
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<publicKey>
   VAPID_PRIVATE_KEY=<privateKey>
   EXCHANGE_RATE_API_KEY=<your-exchange-rate-api-key>
   ```

3. Install dependencies and run the dev server:
   ```bash
   pnpm install
   pnpm dev
   ```

Visit `http://localhost:3000` in your browser.

## Husky
A pre-commit hook checks that the required environment variables are present in `.env.local`.
