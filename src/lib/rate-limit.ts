const tokenBuckets = new Map<string, { tokens: number; lastRefill: number }>();

export function rateLimit(ip: string, maxTokens = 30, refillRate = 30): boolean {
  const now = Date.now();
  const bucket = tokenBuckets.get(ip);

  if (!bucket) {
    tokenBuckets.set(ip, { tokens: maxTokens - 1, lastRefill: now });
    return true;
  }

  const elapsed = (now - bucket.lastRefill) / 60000; // minutes
  bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsed * refillRate);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}
