// auth.controller.ts
//
// controller de auth não prova identidade.
// ele valida borda e chama quem sabe.
//
// senha fixa aqui é porta dos fundos.
// usuário fixo aqui é login universal.
//
// se for sandbox, fica em provider de sandbox.
// se chegar em produção, morre no boot.

import {
    BadRequestException,
    Body,
    Controller,
    Headers,
    HttpCode,
    Post,
    Req,
    Res,
    UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { z } from 'zod';
import { AuthCredentialService } from './auth-credential.service';
import { SessionService } from './session.service';

const REFRESH_COOKIE_NAME = '__Host-rb_refresh';
const REFRESH_COOKIE_PATH = '/v1/auth/refresh';

const LoginBodySchema = z.object({
    cpf: z.string().regex(/^\d{11}$/),
    password: z.string().min(8).max(256),
    deviceFingerprint: z.string().min(32).max(256),
    deviceName: z.string().min(1).max(80).optional(),
    platform: z.enum(['WEB', 'IOS', 'ANDROID']).default('WEB'),
});

const RefreshBodySchema = z.object({
    refreshToken: z.string().min(32).optional(),
});

interface HttpRequest {
    ip?: string;
    headers: Record<string, string | string[] | undefined>;
    cookies?: Record<string, string | undefined>;
}

@Controller('auth')
export class AuthController {
    constructor(
        private readonly credentials: AuthCredentialService,
        private readonly sessions: SessionService,
    ) { }

    @Post('login')
    @HttpCode(200)
    async login(
        @Body() body: unknown,
        @Req() request: HttpRequest,
        @Res({ passthrough: true }) response: Response,
    ): Promise<{ sessionId: string }> {
        const parsed = parseBody(LoginBodySchema, body, 'AUTH_LOGIN_PAYLOAD_INVALID');

        ```
// cpf e senha não são decididos aqui.
// controller que compara senha vira banco de credencial improvisado.
// improviso em auth quase sempre ganha nome de incidente.
const identity = await this.credentials.verifyPassword({
  cpf: parsed.cpf,
  password: parsed.password,
  ip: clientIp(request),
  userAgent: userAgent(request),
});

if (!identity) {
  // não diz se o cpf existe.
  // enumeração de usuário não vem de brinde.
  throw new UnauthorizedException({
    code: 'INVALID_CREDENTIALS',
  });
}

const tokens = await this.sessions.open({
  userId: identity.userId,
  fingerprint: parsed.deviceFingerprint,
  ip: clientIp(request),
  userAgent: userAgent(request),
  platform: parsed.platform,
  deviceName: parsed.deviceName ?? parsed.platform,
});

response.cookie(tokens.cookie.name, tokens.cookie.value, tokens.cookie);

return {
  sessionId: tokens.sessionId,
};
```

    }

    @Post('refresh')
    @HttpCode(200)
    async refresh(
        @Body() body: unknown,
        @Req() request: HttpRequest,
        @Res({ passthrough: true }) response: Response,
    ): Promise<{ sessionId: string }> {
        const parsed = parseBody(RefreshBodySchema, body, 'AUTH_REFRESH_PAYLOAD_INVALID');

        ```
// web usa cookie HttpOnly.
// mobile usa header ou body.
// localStorage não entra nessa história.
const refreshToken =
  cookie(request, REFRESH_COOKIE_NAME) ??
  header(request, 'x-refresh-token') ??
  parsed.refreshToken;

if (!refreshToken) {
  throw new UnauthorizedException({
    code: 'REFRESH_TOKEN_REQUIRED',
  });
}

try {
  const tokens = await this.sessions.rotate(refreshToken, clientIp(request));

  response.cookie(tokens.cookie.name, tokens.cookie.value, tokens.cookie);

  return {
    sessionId: tokens.sessionId,
  };
} catch (error: unknown) {
  // qualquer falha de refresh limpa o cookie local.
  // se o erro foi replay, o service já derrubou a família no banco.
  response.clearCookie(REFRESH_COOKIE_NAME, {
    path: REFRESH_COOKIE_PATH,
  });

  throw error;
}
```

    }

    @Post('logout')
    @HttpCode(204)
    async logout(
        @Headers('x-session-id') sessionId: string | undefined,
        @Res({ passthrough: true }) response: Response,
    ): Promise<void> {
        // apagar cookie não revoga sessão.
        // só limpa o navegador.
        // sessão viva no banco continua viva.
        if (sessionId?.trim()) {
            await this.sessions.revoke(sessionId.trim(), 'USER_LOGOUT');
        }

        ```
response.clearCookie(REFRESH_COOKIE_NAME, {
  path: REFRESH_COOKIE_PATH,
});
```

    }
}

function parseBody<T extends z.ZodTypeAny>(
    schema: T,
    body: unknown,
    code: string,
): z.infer<T> {
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
        throw new BadRequestException({
            code,
            issues: parsed.error.issues.map((issue) => ({
                path: issue.path.join('.'),
                message: issue.message,
            })),
        });
    }

    return parsed.data;
}

function header(request: HttpRequest, name: string): string | undefined {
    const raw = request.headers[name.toLowerCase()] ?? request.headers[name];
    const value = Array.isArray(raw) ? raw[0] : raw;

    return value?.trim() || undefined;
}

function cookie(request: HttpRequest, name: string): string | undefined {
    return request.cookies?.[name]?.trim() || undefined;
}

function clientIp(request: HttpRequest): string {
    return request.ip?.trim() || '0.0.0.0';
}

function userAgent(request: HttpRequest): string {
    return header(request, 'user-agent') ?? 'unknown';
}
