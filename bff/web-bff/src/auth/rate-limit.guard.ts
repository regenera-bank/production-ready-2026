import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * B14 — Rate limiting nativo para /auth/* (anti-brute-force).
 *
 * Janela deslizante por (IP + rota). Sem dependência externa: bucket em memória
 * com limpeza preguiçosa. Em produção multi-instância, trocar o store por Redis
 * mantendo esta interface (a chave e a política de janela ficam idênticas).
 *
 * Limites default: 10 tentativas / 60s por IP+rota. Ajustável por env
 * AUTH_RATELIMIT_MAX e AUTH_RATELIMIT_WINDOW_MS.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

const now = (): number => Date.now();

const clientIp = (req: Request): string => {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) {
    return fwd.split(',')[0]!.trim();
  }
  return req.ip ?? req.socket?.remoteAddress ?? 'unknown';
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly max = Number(process.env.AUTH_RATELIMIT_MAX ?? 10);
  private readonly windowMs = Number(process.env.AUTH_RATELIMIT_WINDOW_MS ?? 60_000);

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const key = `${clientIp(req)}::${req.method}::${req.path}`;
    const ts = now();

    // Limpeza preguiçosa: no máximo varre quando o store cresce.
    if (store.size > 5_000) {
      for (const [k, b] of store) {
        if (b.resetAt <= ts) store.delete(k);
      }
    }

    const bucket = store.get(key);
    if (!bucket || bucket.resetAt <= ts) {
      store.set(key, { count: 1, resetAt: ts + this.windowMs });
      return true;
    }

    if (bucket.count >= this.max) {
      const retryAfter = Math.ceil((bucket.resetAt - ts) / 1000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `Muitas tentativas. Aguarde ${retryAfter}s e tente novamente.`,
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.count += 1;
    return true;
  }
}

/** Exposto para testes: zera o store entre casos. */
export const __resetRateLimitStore = (): void => store.clear();
