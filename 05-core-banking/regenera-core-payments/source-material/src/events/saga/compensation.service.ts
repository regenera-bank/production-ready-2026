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

@Injectable()
export class CompensationService {
  private readonly logger = new Logger(CompensationService.name);

  async rollback(data: any, failedStep: string) {
    this.logger.warn(
      `Compensating failure at ${failedStep} for user ${data.userId}`,
    );

    // Logic for returning reserved balance
    if (
      failedStep === 'EXTERNAL_SETTLEMENT' ||
      failedStep === 'LEDGER_CONFIRMATION'
    ) {
      this.logger.log(`Releasing reserved balance of ${data.amount}`);
      // await ledgerService.releaseReservation(data.id);
    }

    this.logger.log(`Rollback completed for ${data.id}`);
  }
}
