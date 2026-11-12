const buckets = new Map();

const createRateLimiter = ({ windowMs, max, message }) => {
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now >= bucket.resetAt) buckets.delete(key);
    }
  }, windowMs);
  cleanup.unref();

  return (req, res, next) => {
    const key = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
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

const chatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many chat messages. Please wait a minute and try again.',
});

module.exports = { createRateLimiter, chatRateLimiter };
