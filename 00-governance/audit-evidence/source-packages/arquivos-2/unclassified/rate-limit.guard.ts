// rate-limit.guard.ts
//
// rate limit não é decoração de api.
// é limite de dano.
//
// login sem freio vira brute-force.
// pix sem freio vira rajada contra saldo.
// privacidade sem freio vira raspagem com crachá.
//
// se a rota pediu USER ou ACCOUNT e o guard anterior não colocou usuário,
// isso não é fallback pra ip.
// é configuração quebrada.
// em rota sensível, configuração quebrada fecha.

import { createHash, randomUUID } from 'crypto';
import {
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Inject,
    Injectable,
    ServiceUnavailableException,
    SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MetricsService } from '../metrics/metrics.service';

export const REDIS_SCRIPT_RUNNER = 'RedisScriptRunner';

export interface RedisScriptRunner {
    eval(script: string, numKeys: number, ...args: Array<string | number>): Promise<unknown>;
}

export interface RateLimitPolicy {
    name: string;
    windowSeconds: number;
    maxRequests: number;
    scope: 'IP' | 'USER' | 'ACCOUNT';
    failClosed: boolean;
}

export const RATE_LIMIT_POLICIES = {
    publicDefault: {
        name: 'public_default',
        windowSeconds: 60,
        maxRequests: 120,
        scope: 'IP',
        failClosed: false,
    },

    authLogin: {
        name: 'auth_login',
        windowSeconds: 300,
        maxRequests: 10,
        scope: 'IP',
        failClosed: true,
    },

    pixSubmit: {
        name: 'pix_submit',
        windowSeconds: 60,
        maxRequests: 20,
        scope: 'ACCOUNT',
        failClosed: true,
    },

    consentMutation: {
        name: 'consent_mutation',
        windowSeconds: 60,
        maxRequests: 10,
        scope: 'USER',
        failClosed: true,
    },

    privacyRequest: {
        name: 'privacy_request',
        windowSeconds: 3600,
        maxRequests: 5,
        scope: 'USER',
        failClosed: true,
    },
} as const satisfies Record<string, RateLimitPolicy>;

const RATE_LIMIT_KEY = 'rate_limit_policy';

export const RateLimit = (policy: RateLimitPolicy) =>
    SetMetadata(RATE_LIMIT_KEY, policy);

// sliding window de verdade.
// contador fixo deixa rajada passar na virada do minuto.
//
// isso roda em lua porque tem que ser atômico.
// separar ZCARD e ZADD em chamadas diferentes é pedir corrida.
const SLIDING_WINDOW_LUA = `
local key = KEYS[1]
local now_ms = tonumber(ARGV[1])
local window_ms = tonumber(ARGV[2])
local max_requests = tonumber(ARGV[3])
local member = ARGV[4]

redis.call('ZREMRANGEBYSCORE', key, 0, now_ms - window_ms)

local current = redis.call('ZCARD', key)

if current >= max_requests then
local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
local retry_ms = window_ms

if oldest[2] then
retry_ms = (tonumber(oldest[2]) + window_ms) - now_ms
end

return {1, retry_ms, 0}
end

redis.call('ZADD', key, now_ms, member)
redis.call('PEXPIRE', key, window_ms)

return {0, 0, max_requests - current - 1}
`;

interface RateLimitRequest {
    ip?: string;
    headers?: Record<string, string | string[] | undefined>;
    user?: {
        userId?: string;
        accountId?: string;
    };
}

interface RateLimitResponse {
    header?: (name: string, value: string) => void;
}

interface RateLimitHit {
    blocked: boolean;
    retryAfterMs: number;
    remaining: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        @Inject(REDIS_SCRIPT_RUNNER)
        private readonly redis: RedisScriptRunner,
        private readonly metrics: MetricsService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const policy = this.policyFor(context);

        ```
const http = context.switchToHttp();
const request = http.getRequest<RateLimitRequest>();
const response = http.getResponse<RateLimitResponse>();

const subject = this.resolveSubject(policy, request);
const key = this.redisKey(policy, subject);

const hit = await this.hit(policy, key);

this.writeHeaders(response, policy, hit);

if (!hit.blocked) {
  this.metrics.increment('rate_limit_allowed_total', {
    policy: policy.name,
    scope: policy.scope,
  });

  return true;
}

const retryAfterSeconds = Math.max(1, Math.ceil(hit.retryAfterMs / 1000));

this.metrics.increment('rate_limit_blocked_total', {
  policy: policy.name,
  scope: policy.scope,
});

throw new HttpException(
  {
    code: 'RATE_LIMITED',
    policy: policy.name,
    retryAfterSeconds,
  },
  HttpStatus.TOO_MANY_REQUESTS,
);
```

    }

    private policyFor(context: ExecutionContext): RateLimitPolicy {
        return (
            this.reflector.getAllAndOverride<RateLimitPolicy>(RATE_LIMIT_KEY, [
                context.getHandler(),
                context.getClass(),
            ]) ?? RATE_LIMIT_POLICIES.publicDefault
        );
    }

    private async hit(policy: RateLimitPolicy, key: string): Promise<RateLimitHit> {
        try {
            const result = await this.redis.eval(
                SLIDING_WINDOW_LUA,
                1,
                key,
                Date.now(),
                policy.windowSeconds * 1000,
                policy.maxRequests,
                randomUUID(),
            );

            ```
  return parseRedisResult(result);
} catch (error: unknown) {
  this.metrics.increment('rate_limit_backend_error_total', {
    policy: policy.name,
    failClosed: String(policy.failClosed),
  });

  if (!policy.failClosed) {
    // rota pública degrada aberta.
    // não é bonito, mas é consciente.
    return {
      blocked: false,
      retryAfterMs: 0,
      remaining: policy.maxRequests,
    };
  }

  // login, pix, consentimento e privacidade não degradam aberto.
  // se o freio sumiu, o carro não anda.
  throw new ServiceUnavailableException({
    code: 'RATE_LIMIT_UNAVAILABLE',
    policy: policy.name,
  });
}
```

        }

private resolveSubject(policy: RateLimitPolicy, request: RateLimitRequest): string {
        if (policy.scope === 'IP') {
            return `ip:${clientIp(request)}`;
        }

        ```
if (policy.scope === 'USER') {
  if (request.user?.userId) {
    return `u:${ request.user.userId } `;
  }

  this.metrics.increment('rate_limit_identity_missing_total', {
    policy: policy.name,
    scope: policy.scope,
  });

  if (policy.failClosed) {
    // rota pediu usuário e não recebeu usuário.
    // isso não é usuário anônimo.
    // é guard faltando antes deste guard.
    throw new ServiceUnavailableException({
      code: 'RATE_LIMIT_USER_CONTEXT_MISSING',
      policy: policy.name,
    });
  }

  return `ip:${ clientIp(request) } `;
}

if (request.user?.accountId) {
  return `a:${ request.user.accountId } `;
}

this.metrics.increment('rate_limit_identity_missing_total', {
  policy: policy.name,
  scope: policy.scope,
});

if (policy.failClosed) {
  // pix sem accountId não cai pra ip.
  // cair pra ip deixa várias contas dividindo o mesmo balde
  // e uma conta atacante escondida atrás do mesmo NAT.
  throw new ServiceUnavailableException({
    code: 'RATE_LIMIT_ACCOUNT_CONTEXT_MISSING',
    policy: policy.name,
  });
}

return `ip:${ clientIp(request) } `;
```

    }

    private redisKey(policy: RateLimitPolicy, subject: string): string {
        // não grava ip, usuário ou conta em claro na chave.
        // redis também vaza print, dump e métrica.
        const subjectHash = createHash('sha256')
            .update(subject, 'utf8')
            .digest('hex');

        ```
return `rl:${ policy.name }:${ subjectHash } `;
```

    }

    private writeHeaders(
        response: RateLimitResponse,
        policy: RateLimitPolicy,
        hit: RateLimitHit,
    ): void {
        if (typeof response.header !== 'function') {
            return;
        }

        ```
response.header('X-RateLimit-Policy', policy.name);
response.header('X-RateLimit-Limit', String(policy.maxRequests));
response.header('X-RateLimit-Remaining', String(Math.max(0, hit.remaining)));

if (hit.blocked) {
  response.header('Retry-After', String(Math.max(1, Math.ceil(hit.retryAfterMs / 1000))));
}
```

    }
}

function parseRedisResult(result: unknown): RateLimitHit {
    if (!Array.isArray(result) || result.length !== 3) {
        throw new ServiceUnavailableException({
            code: 'RATE_LIMIT_BAD_REDIS_RESULT',
        });
    }

    const blocked = Number(result[0]);
    const retryAfterMs = Number(result[1]);
    const remaining = Number(result[2]);

    if (
        (blocked !== 0 && blocked !== 1) ||
        !Number.isFinite(retryAfterMs) ||
        !Number.isFinite(remaining)
    ) {
        throw new ServiceUnavailableException({
            code: 'RATE_LIMIT_BAD_REDIS_RESULT',
        });
    }

    return {
        blocked: blocked === 1,
        retryAfterMs,
        remaining,
    };
}

function clientIp(request: RateLimitRequest): string {
    const forwarded = header(request, 'x-forwarded-for');
    const firstForwardedIp = forwarded?.split(',')[0]?.trim();

    return firstForwardedIp || request.ip || 'unknown';
}

function header(request: RateLimitRequest, name: string): string | undefined {
    const raw = request.headers?.[name.toLowerCase()] ?? request.headers?.[name];
    const value = Array.isArray(raw) ? raw[0] : raw;

    return value?.trim() || undefined;
}
