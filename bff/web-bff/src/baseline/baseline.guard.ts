import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

export const isBaselineModeEnabled = (): boolean =>
  process.env.HOMOLOG_BASELINE_MODE?.trim().toLowerCase() === 'true';

@Injectable()
export class BaselineGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (!isBaselineModeEnabled()) {
      throw new ForbiddenException('Baseline homolog desabilitado');
    }
    const request = context.switchToHttp().getRequest<Request>();
    const expected = process.env.BASELINE_OPERATOR_TOKEN?.trim();
    if (!expected) {
      throw new ForbiddenException('BASELINE_OPERATOR_TOKEN ausente');
    }
    const provided =
      request.headers['x-baseline-operator-token']?.toString().trim() ?? '';
    if (provided !== expected) {
      throw new ForbiddenException('Token de operador baseline inválido');
    }
    return true;
  }
}