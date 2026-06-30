// session-auth.guard.ts
//
// antes deste arquivo, a "autenticação" do pix era acreditar no header
// x-user-id que o próprio cliente escreve. qualquer um debitava qualquer
// conta trocando um header no curl. isso não é autenticação, é etiqueta.
//
// agora: rota financeira exige x-session-id de uma sessão ACTIVE, não
// expirada, pertencente ao usuário do header. e o guard popula
// request.user — que o rate-limit por USER/ACCOUNT esperava e nunca
// recebia, então degradava pra IP em silêncio. dois buracos, um fecho.
//
// o que AINDA falta, dito sem vergonha: o vínculo conta↔usuário.
// não existe tabela accounts neste schema; quando ela nascer, a
// checagem entra aqui dentro e este comentário sai.

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SessionService } from './session.service';

const REQUIRE_SESSION_KEY = 'require_session';

export const RequireSession = () => SetMetadata(REQUIRE_SESSION_KEY, true);

export interface RequestUserContext {
  userId: string;
  sessionId: string;
  accountId?: string;
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(REQUIRE_SESSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest<{
      headers?: Record<string, string | string[] | undefined>;
      user?: RequestUserContext;
    }>();

    const sessionId = headerValue(request.headers?.['x-session-id']);
    const userId = headerValue(request.headers?.['x-user-id']);
    if (!sessionId || !userId) {
      // sem sessão não tem conversa. 401 seco, sem dica de qual faltou —
      // quem é legítimo sabe o que mandar, quem está sondando não ganha mapa.
      throw new UnauthorizedException({ code: 'SESSION_REQUIRED' });
    }

    // a validação é no banco, toda vez. sessão revogada às 14h03
    // para de debitar às 14h03, não no próximo deploy.
    const valid = await this.sessions.validateActive(sessionId, userId);
    if (!valid) {
      throw new UnauthorizedException({ code: 'SESSION_INVALID' });
    }

    request.user = {
      userId,
      sessionId,
      accountId: headerValue(request.headers?.['x-account-id']),
    };
    return true;
  }
}

function headerValue(raw: string | string[] | undefined): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value?.trim() || undefined;
}
