// Minimal fixed-window limiter scoped to the AI proxy routes, since those
// are the calls that cost real money once a real vendor key is plugged in.
// Swap for a Redis-backed limiter before running more than one instance.
const hits = new Map();
const emailAuthHits = new Map();

function aiRateLimiter({ windowMs = 60_000, max = 20 } = {}) {
  return (req, res, next) => {
    const key = req.user?.sub || req.ip;
    const now = Date.now();
    const entry = hits.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }

    entry.count += 1;
    hits.set(key, entry);

    if (entry.count > max) {
      return res.status(429).json({ error: 'Too many AI requests - slow down a little.' });
    }
    next();
  };
}

function emailAuthRateLimiter({ windowMs = 10 * 60_000, max = 15 } = {}) {
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const entry = emailAuthHits.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + windowMs;
    }
    entry.count += 1;
    emailAuthHits.set(key, entry);

    if (emailAuthHits.size > 5000) {
      for (const [ip, value] of emailAuthHits) {
        if (now > value.resetAt) emailAuthHits.delete(ip);
      }
    }
    if (entry.count > max) {
      return res.status(429).json({ error: 'Too many sign-in attempts. Please try again later.' });
    }
    next();
  };
}

module.exports = { aiRateLimiter, emailAuthRateLimiter };
