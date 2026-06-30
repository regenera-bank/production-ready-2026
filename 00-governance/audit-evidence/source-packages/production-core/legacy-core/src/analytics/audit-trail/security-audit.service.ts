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

import { Injectable, Logger } from '@nestjs/common';
import { AuditSigner } from './audit-sign';

export interface AuditLog {
  userId: string;
  action: string;
  resource: string;
  timestamp: string;
  metadata: any;
  hash?: string;
}

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);

  constructor(private readonly signer: AuditSigner) {}

  async logAction(log: AuditLog) {
    const signedLog = {
      ...log,
      timestamp: log.timestamp || new Date().toISOString(),
      hash: this.signer.sign(log),
    };

    // No mundo real, enviamos para o Cloud Logging ou uma tabela de auditoria protegida
    this.logger.log(
      `SECURE_AUDIT: [${signedLog.action}] by ${signedLog.userId} - Hash: ${signedLog.hash}`,
    );

    return signedLog;
  }
}
