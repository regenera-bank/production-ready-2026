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
import { PubSubClient } from './pubsub-client';

@Injectable()
export class DeadLetterHandler {
  private readonly logger = new Logger(DeadLetterHandler.name);

  constructor(private pubsubClient: PubSubClient) {}

  async handleCorruptedMessage(
    topicName: string,
    error: Error,
    originalPayload: any,
  ) {
    const dlqTopic = `${topicName}.dlq`;
    const client = this.pubsubClient.getClient();

    this.logger.error(
      `Critical Failure on topic ${topicName}: ${error.message}`,
    );

    await client.topic(dlqTopic).publishMessage({
      json: {
        originalTopic: topicName,
        error: error.message,
        timestamp: new Date().toISOString(),
        payload: originalPayload,
      },
      attributes: {
        severity: 'CRITICAL',
        retry: 'false',
      },
    });

    this.logger.warn(`Message routed to DLQ: ${dlqTopic}`);
  }
}
