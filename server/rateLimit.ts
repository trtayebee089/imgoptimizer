import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';

// Fixed-window rate limiter stored in MongoDB, so limits hold across serverless
// instances (an in-memory counter resets on every cold start). Expired windows
// are removed by a TTL index.

const RateLimitSchema = new mongoose.Schema({
  _id: { type: String },
  count: { type: Number, required: true },
  expiresAt: { type: Date, required: true, expires: 0 },
}, { versionKey: false });

export const RateLimit: mongoose.Model<any> = mongoose.models.RateLimit || mongoose.model('RateLimit', RateLimitSchema);

/** Client IP. On Vercel the platform overwrites x-forwarded-for, so Express' `trust proxy` gives the real client. */
export const clientIp = (req: Request) => req.ip || req.socket.remoteAddress || 'unknown';

const hashKey = (s: string) => crypto.createHash('sha256').update(s).digest('base64url').slice(0, 32);

/** Increments the counter for `key` and returns whether the request is within `max` per `windowMs`. */
export const hit = async (key: string, max: number, windowMs: number): Promise<{ ok: boolean; retryAfter: number }> => {
  const now = Date.now();
  const windowStart = Math.floor(now / windowMs) * windowMs;
  const id = `${hashKey(key)}:${windowStart}`;
  const upsert = () => RateLimit.findOneAndUpdate(
    { _id: id },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(windowStart + windowMs) } },
    { upsert: true, returnDocument: 'after', lean: true },
  );
  let doc: any;
  try {
    doc = await upsert();
  } catch (err: any) {
    // Two concurrent first hits can race on the insert; the retry then increments.
    if (err?.code !== 11000) throw err;
    doc = await upsert();
  }
  return { ok: (doc?.count ?? 1) <= max, retryAfter: Math.ceil((windowStart + windowMs - now) / 1000) };
};

export const TOO_MANY = 'Too many attempts. Please wait a few minutes and try again.';

/** Express middleware limiting by client IP (plus an optional extra key such as the submitted email). */
export const rateLimit = (name: string, max: number, windowMs: number, extraKey?: (req: Request) => string | null) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const keys = [`${name}:ip:${clientIp(req)}`];
      const extra = extraKey?.(req);
      if (extra) keys.push(`${name}:k:${extra}`);
      for (const key of keys) {
        const { ok, retryAfter } = await hit(key, max, windowMs);
        if (!ok) {
          res.setHeader('Retry-After', String(retryAfter));
          return res.status(429).json({ error: TOO_MANY });
        }
      }
      next();
    } catch (err) {
      next(err);
    }
  };
