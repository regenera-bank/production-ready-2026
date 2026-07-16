import { HttpException } from '@nestjs/common';
import { RateLimitGuard, __resetRateLimitStore } from './rate-limit.guard';

const ctxFor = (ip: string, path = '/auth/session') =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'POST',
        path,
        ip,
        headers: {},
        socket: { remoteAddress: ip },
      }),
    }),
  }) as never;

describe('RateLimitGuard (B14 — anti-brute-force)', () => {
  beforeEach(() => {
    __resetRateLimitStore();
    process.env.AUTH_RATELIMIT_MAX = '3';
    process.env.AUTH_RATELIMIT_WINDOW_MS = '60000';
  });

  it('libera dentro do limite e bloqueia ao exceder', () => {
    const guard = new RateLimitGuard();
    const ctx = ctxFor('1.1.1.1');
    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
    expect(() => guard.canActivate(ctx)).toThrow(HttpException);
  });

  it('isola o bucket por IP', () => {
    const guard = new RateLimitGuard();
    for (let i = 0; i < 3; i += 1) guard.canActivate(ctxFor('2.2.2.2'));
    // IP diferente não é afetado pelo estouro do primeiro.
    expect(guard.canActivate(ctxFor('3.3.3.3'))).toBe(true);
  });

  it('isola o bucket por rota', () => {
    const guard = new RateLimitGuard();
    for (let i = 0; i < 3; i += 1) guard.canActivate(ctxFor('4.4.4.4', '/auth/session'));
    expect(guard.canActivate(ctxFor('4.4.4.4', '/auth/register'))).toBe(true);
  });
});
