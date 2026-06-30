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

import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PubSubClient } from './pubsub-client';

@Injectable()
export class TopicCreator implements OnModuleInit {
  private readonly logger = new Logger(TopicCreator.name);
  private readonly topics = [
    'pix.initiated',
    'pix.settled',
    'pix.failed',
    'ledger.update',
    'compliance.check',
  ];

  constructor(private pubsubClient: PubSubClient) {}

  async onModuleInit() {
    await this.assertTopics();
  }

  private async assertTopics() {
    const client = this.pubsubClient.getClient();
    for (const topicName of this.topics) {
      const [topic] = await client.topic(topicName).get({ autoCreate: true });
      this.logger.log(`Verified topic: ${topic.name}`);
    }
  }
}
