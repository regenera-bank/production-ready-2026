import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { PartnerApiException } from './partner-api.exception';

type Bucket = { count: number; resetAt: number };

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly buckets = new Map<string, Bucket>();
  private readonly max = Number(process.env.PARTNER_RATE_LIMIT_MAX ?? 300);
  private readonly windowMs = Number(process.env.PARTNER_RATE_LIMIT_WINDOW_MS ?? 60_000);

  use(req: Request, res: Response, next: NextFunction): void {
    const key =
      (req as Request & { mtlsThumbprint?: string }).mtlsThumbprint ??
      req.ip ??
      'anonymous';
    const now = Date.now();
    const bucket = this.buckets.get(key) ?? { count: 0, resetAt: now + this.windowMs };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + this.windowMs;
    }

    bucket.count += 1;
    this.buckets.set(key, bucket);

    const remaining = Math.max(0, this.max - bucket.count);
    res.setHeader('X-RateLimit-Limit', String(this.max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > this.max) {
      throw new PartnerApiException('RBK-SYS-003', 429, 'Rate limit exceeded');
    }

    next();
  }
}