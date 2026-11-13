// Simple in-memory fixed-window rate limiter. Each created limiter owns its
// own bucket Map, so two limiters never share counters. Requests are counted
// per user (or per IP for guests) by default, or under one shared key when
// `key` is supplied — that is how the global AI limit is enforced.
const createRateLimiter = ({ windowMs, max, message, key }) => {
  const buckets = new Map();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [bucketKey, bucket] of buckets) {
      if (now >= bucket.resetAt) buckets.delete(bucketKey);
    }
  }, windowMs);
  cleanup.unref();

  return (req, res, next) => {
    const bucketKey = key || (req.user ? `user:${req.user.id}` : `ip:${req.ip}`);
    const now = Date.now();
    let bucket = buckets.get(bucketKey);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(bucketKey, bucket);
    }

    bucket.count += 1;

    if (bucket.count > max) {
      res.set('Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({
        message: message || 'Too many requests, please try again later.',
      });
    }

    next();
  };
};

const CHAT_WINDOW_MS = 60 * 1000;

// Per user: one person can send at most 12 chat messages per minute.
const chatUserRateLimiter = createRateLimiter({
  windowMs: CHAT_WINDOW_MS,
  max: Number(process.env.AI_USER_RPM) || 12,
  message: 'Too many chat messages. Please wait a minute and try again.',
});

// Global: ALL users combined share one counter, so total AI traffic stays
// below the provider's free-tier request limit. One chat message can trigger
// up to 3 model calls inside the Venuora graph, so keep this conservative.
const chatGlobalRateLimiter = createRateLimiter({
  windowMs: CHAT_WINDOW_MS,
  max: Number(process.env.AI_GLOBAL_RPM) || 18,
  key: 'global_ai_limit',
  message: 'Server is busy right now. Please try again in a few seconds.',
});

module.exports = { createRateLimiter, chatUserRateLimiter, chatGlobalRateLimiter };
