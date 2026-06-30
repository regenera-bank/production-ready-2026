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

import { Logger } from '@nestjs/common';

export async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
): Promise<T> {
  const logger = new Logger('NeonRetry');

  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;

      const waitTime = delay * Math.pow(2, i);
      logger.warn(
        `Connection failed. Retrying in ${waitTime}ms... (Attempt ${i + 1}/${retries})`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
  throw new Error('Operation failed after max retries');
}
