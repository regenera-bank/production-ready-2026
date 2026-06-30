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

import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class AuditSigner {
  private lastHash: string = '0'.repeat(64);
  private readonly secret =
    process.env.AUDIT_SIGN_SECRET || 'regenera-ultra-secret';

  sign(payload: any): string {
    const data = JSON.stringify(payload) + this.lastHash;
    const currentHash = crypto
      .createHmac('sha256', this.secret)
      .update(data)
      .digest('hex');

    this.lastHash = currentHash;
    return currentHash;
  }

  verifyChain(logs: any[]): boolean {
    let expectedPrevHash = '0'.repeat(64);
    for (const log of logs) {
      const { hash, ...payload } = log;
      const data = JSON.stringify(payload) + expectedPrevHash;
      const calculatedHash = crypto
        .createHmac('sha256', this.secret)
        .update(data)
        .digest('hex');

      if (calculatedHash !== hash) return false;
      expectedPrevHash = hash;
    }
    return true;
  }
}
