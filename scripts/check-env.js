/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = '.env.local';
let envContent = '';
try {
  envContent = fs.readFileSync(path, 'utf8');
} catch {
  console.error('Missing .env.local file');
  process.exit(1);
}
const env = Object.fromEntries(
  envContent.split(/\n/).filter(Boolean).map(line => {
    const [key, ...rest] = line.split('=');
    return [key.trim(), rest.join('=')];
  })
);
const required = ['NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'EXCHANGE_RATE_API_KEY'];
const missing = required.filter(key => !env[key]);
if (missing.length) {
  console.error(`Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}
