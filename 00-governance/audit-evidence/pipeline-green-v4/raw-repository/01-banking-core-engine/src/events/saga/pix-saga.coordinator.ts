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
import { SagaStepsRegistry } from './saga-steps.registry';
import { CompensationService } from './compensation.service';

@Injectable()
export class PixSagaCoordinator {
  private readonly logger = new Logger(PixSagaCoordinator.name);

  constructor(
    private registry: SagaStepsRegistry,
    private compensation: CompensationService,
  ) {}

  async orchestratePixTransfer(transactionData: any) {
    const steps = this.registry.getSteps();
    this.logger.log(`Starting Saga for Transaction: ${transactionData.id}`);

    for (const step of steps) {
      try {
        this.logger.debug(`Executing step: ${step.name}`);
        await step.execute(transactionData);
      } catch (error) {
        this.logger.error(
          `Saga failed at step ${step.name}. Triggering compensation...`,
        );
        await this.compensation.rollback(transactionData, step.name);
        throw error;
      }
    }

    this.logger.log(`Saga completed successfully for ${transactionData.id}`);
  }
}
