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
import { BigQueryProvider } from './bigquery.provider';
import { StreamBufferManager } from './stream-buffer.manager';

export interface LedgerEntry {
  transaction_id: string;
  account_id: string;
  amount: number;
  currency: string;
  operation_type: 'DEBIT' | 'CREDIT';
  timestamp: string;
  metadata: string;
}

@Injectable()
export class LedgerStreamService {
  private readonly logger = new Logger(LedgerStreamService.name);
  private readonly datasetId = 'regenera_ledger';
  private readonly tableId = 'immutable_entries';

  constructor(
    private readonly bqProvider: BigQueryProvider,
    private readonly bufferManager: StreamBufferManager<LedgerEntry>,
  ) {
    this.bufferManager.onFlush(async (entries) =>
      this.flushToBigQuery(entries),
    );
  }

  async streamEntry(entry: LedgerEntry) {
    this.bufferManager.add(entry);
  }

  private async flushToBigQuery(entries: LedgerEntry[]) {
    try {
      const table = this.bqProvider.getTable(this.datasetId, this.tableId);
      await table.insert(entries, {
        raw: false,
        skipInvalidRows: false,
        ignoreUnknownValues: false,
      });
      this.logger.log(
        `Successfully streamed ${entries.length} entries to BigQuery`,
      );
    } catch (error) {
      this.logger.error('BigQuery Streaming Insert Failed', error.stack);
      // Aqui entraria lógica de Dead Letter Queue (DLQ)
    }
  }
}
