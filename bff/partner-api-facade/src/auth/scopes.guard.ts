import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SCOPES_KEY } from './scopes.decorator';
import type { PartnerPrincipal } from './principal.types';
import { PartnerApiException } from '../common/partner-api.exception';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ principal?: PartnerPrincipal }>();
    const principal = request.principal;
    if (!principal) {
      throw new PartnerApiException('RBK-AUTH-001', 401, 'Bearer token required');
    }

    for (const scope of required) {
      if (!principal.scopes.has(scope)) {
        throw new PartnerApiException('RBK-AUTH-003', 403, `Missing scope: ${scope}`);
      }
    }

    return true;
  }
}