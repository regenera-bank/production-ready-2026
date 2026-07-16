import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { OperationsRequestContext } from './operations-context';
import { IS_PUBLIC_KEY } from './public.decorator';
import { PERMISSIONS_KEY } from './require-permission.decorator';
import { normalizeRole, permissionsForRole } from './roles';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request & { operations?: OperationsRequestContext }>();
    const operatorId = String(
      request.headers['x-operator-id'] ?? process.env.OPERATIONS_BFF_DEV_OPERATOR ?? 'dev-operator',
    );
    const role = normalizeRole(
      String(request.headers['x-operator-role'] ?? process.env.OPERATIONS_BFF_DEV_ROLE ?? 'supervisor'),
    );
    const permissions = permissionsForRole(role);

    request.operations = { operatorId, role, permissions };

    if (!operatorId.trim()) {
      throw new UnauthorizedException('x-operator-id required');
    }

    if (!required?.length) {
      return true;
    }

    const granted = required.every((permission) => permissions.includes(permission));
    if (!granted) {
      throw new ForbiddenException({
        code: 'RBAC_FORBIDDEN',
        message: `Role '${role}' lacks required permission(s): ${required.join(', ')}`,
      });
    }

    return true;
  }
}