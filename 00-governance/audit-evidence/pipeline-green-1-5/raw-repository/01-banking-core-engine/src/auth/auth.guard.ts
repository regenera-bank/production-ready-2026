/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

// |---------------------------------------------------------------------------------------|
// |  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
// |---------------------------------------------------------------------------------------|
//
// PROJECT:       Regenera Bank
// CEO:           Raphaela Cerveski
// DEVELOPER:     Don Paulo Ricardo
// ID:            2098233287
// COPYRIGHT:     Copyright (c) 2026 Regenera Corporate
//
// LICENSE:       EULA (End-User License Agreement)
// PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA
//
// WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
//                engenharia reversa ou modificação não autorizada.
//
// |---------------------------------------------------------------------------------------|
// |  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
// |---------------------------------------------------------------------------------------|

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as admin from 'firebase-admin';
import { tenantContext } from '../common/tenant/tenant.context';

/**
 * Neural Auth Guard - validates the Bearer JWT or Firebase IdToken
 * on every protected endpoint. Attaches decoded payload to request.user.
 */
@Injectable()
export class NeuralAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization || '';
    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException(
        'Protocolo Neural ou Firebase IdToken ausente.',
      );
    }

    try {
      // Prioritize Firebase IdToken verification (Zero Trust propagation)
      const decodedToken = await admin.auth().verifyIdToken(token);
      request.user = {
        sub: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || 'user',
      };

      this.injectTenantContext(decodedToken, request);
      return true;
    } catch (firebaseError: any) {
      // Fallback to local JWT (Protocolo Neural) for tests and internal tokens
      try {
        const decodedToken = await this.jwtService.verifyAsync(token);
        request.user = decodedToken;
        this.injectTenantContext(decodedToken, request);
        return true;
      } catch (jwtError: any) {
        throw new UnauthorizedException(
          `Autenticação falhou: Firebase IdToken ou Token local inválidos. Erro Firebase: ${firebaseError.message}`,
        );
      }
    }
  }

  private injectTenantContext(decodedToken: any, request: any) {
    const tenantId =
      decodedToken.tenantId ||
      request.headers['x-tenant-id'] ||
      'default-tenant';
    const organizationId =
      decodedToken.organizationId || request.headers['x-organization-id'];
    const environment =
      decodedToken.environment || process.env.NODE_ENV || 'development';

    tenantContext.enterWith({
      tenantId,
      organizationId,
      environment,
    });
  }
}
