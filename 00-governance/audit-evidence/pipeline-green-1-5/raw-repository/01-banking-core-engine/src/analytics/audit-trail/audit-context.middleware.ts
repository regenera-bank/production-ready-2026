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

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuditMetadataMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const auditContext = {
      ip: req.ip || req.headers['x-forwarded-for'],
      userAgent: req.headers['user-agent'],
      correlationId: req.headers['x-correlation-id'] || `corr-${Date.now()}`,
      path: req.path,
      method: req.method,
    };

    // Anexamos o contexto ao request para ser capturado pelo SecurityAuditService
    (req as any).auditContext = auditContext;

    next();
  }
}
