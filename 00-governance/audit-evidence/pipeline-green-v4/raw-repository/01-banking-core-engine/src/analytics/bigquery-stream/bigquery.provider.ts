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

import { BigQuery } from '@google-cloud/bigquery';
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';

@Injectable()
export class BigQueryProvider implements OnModuleInit {
  private readonly logger = new Logger(BigQueryProvider.name);
  private bq: BigQuery;

  async onModuleInit() {
    this.logger.log(
      'Initializing BigQuery Connection with gRPC optimization...',
    );
    this.bq = new BigQuery({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_KEYFILE_PATH,
      autoRetry: true,
      maxRetries: 3,
    });
  }

  public getClient(): BigQuery {
    return this.bq;
  }

  public getDataset(datasetId: string) {
    return this.bq.dataset(datasetId);
  }

  public getTable(datasetId: string, tableId: string) {
    return this.bq.dataset(datasetId).table(tableId);
  }
}
