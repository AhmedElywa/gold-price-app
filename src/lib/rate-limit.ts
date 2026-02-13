const tokenBuckets = new Map<string, { tokens: number; lastRefill: number }>();
const MAX_BUCKETS = 10_000;
const BUCKET_TTL_MS = 10 * 60 * 1000;
const SWEEP_INTERVAL_MS = 60 * 1000;
let lastSweepAt = 0;

function sweepBuckets(now: number) {
  // Remove stale buckets first.
  for (const [key, bucket] of tokenBuckets) {
    if (now - bucket.lastRefill > BUCKET_TTL_MS) {
      tokenBuckets.delete(key);
    }
  }

  // Hard cap memory in case active cardinality is still too high.
  if (tokenBuckets.size > MAX_BUCKETS) {
    const overflow = tokenBuckets.size - MAX_BUCKETS;
    let removed = 0;
    for (const key of tokenBuckets.keys()) {
      tokenBuckets.delete(key);
      removed += 1;
      if (removed >= overflow) {
        break;
      }
    }
  }

  lastSweepAt = now;
}

function maybeSweepBuckets(now: number) {
  if (tokenBuckets.size > MAX_BUCKETS || now - lastSweepAt >= SWEEP_INTERVAL_MS) {
    sweepBuckets(now);
  }
}

export function rateLimit(ip: string, maxTokens = 30, refillRate = 30): boolean {
  const now = Date.now();
  maybeSweepBuckets(now);
  const bucket = tokenBuckets.get(ip);

  if (!bucket) {
    tokenBuckets.set(ip, { tokens: maxTokens - 1, lastRefill: now });
    if (tokenBuckets.size > MAX_BUCKETS) {
      sweepBuckets(now);
    }
    return true;
  }

  const elapsed = (now - bucket.lastRefill) / 60000; // minutes
  bucket.tokens = Math.min(maxTokens, bucket.tokens + elapsed * refillRate);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}
