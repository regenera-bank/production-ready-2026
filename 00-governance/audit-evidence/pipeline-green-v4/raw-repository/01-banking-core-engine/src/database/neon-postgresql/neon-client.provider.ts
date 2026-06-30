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

import { DataSource } from 'typeorm';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class NeonClientProvider implements OnModuleInit, OnModuleDestroy {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: true,
      extra: {
        max: 20, // Optimized for serverless concurrency
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      logging: process.env.NODE_ENV === 'development',
    });
  }

  async onModuleInit() {
    await this.dataSource.initialize();
    console.log('Neon PostgreSQL Connection Established');
  }

  async onModuleDestroy() {
    await this.dataSource.destroy();
  }

  getDataSource(): DataSource {
    return this.dataSource;
  }
}
