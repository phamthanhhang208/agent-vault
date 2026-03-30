/**
 * Simple in-memory rate limiter for API routes.
 * For production, use Vercel KV or Upstash Redis.
 *
 * Note: In serverless, in-memory state is per-instance and ephemeral.
 * This provides basic burst protection but not true distributed rate limiting.
 */

const requests = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  maxRequests = 60,
  windowMs = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = requests.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    requests.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

// Cleanup old entries periodically (prevent memory leak)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of requests) {
    if (now > entry.resetAt) {
      requests.delete(key);
    }
  }
}, 60000);
