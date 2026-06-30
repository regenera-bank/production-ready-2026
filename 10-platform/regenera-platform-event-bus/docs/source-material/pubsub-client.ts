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

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PubSub } from '@google-cloud/pubsub';

@Injectable()
export class PubSubClient implements OnModuleInit, OnModuleDestroy {
  private client: PubSub;
  private readonly logger = new Logger(PubSubClient.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('Initializing GCP Pub/Sub Client...');
    const projectId = this.configService.get<string>('GCP_PROJECT_ID');
    const credentialsPath = this.configService.get<string>(
      'GOOGLE_APPLICATION_CREDENTIALS',
    );

    this.client = new PubSub({
      projectId,
      keyFilename: credentialsPath,
    });

    this.logger.log(`Pub/Sub Client ready for project: ${projectId}`);
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.close();
      this.logger.log('Pub/Sub Client connection closed.');
    }
  }

  getClient(): PubSub {
    return this.client;
  }
}
