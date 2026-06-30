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
import { Storage } from '@google-cloud/storage';
import { BigQueryProvider } from '../bigquery-stream/bigquery.provider';

@Injectable()
export class ReportExporterService {
  private readonly logger = new Logger(ReportExporterService.name);
  private storage = new Storage();

  constructor(private readonly bq: BigQueryProvider) {}

  async exportMonthlyRegulatoryReport(month: string) {
    const fileName = `regulatory-reports/REGENERA_MONTHLY_${month}.csv`;
    const bucketName =
      process.env.REPORTS_BUCKET || 'regenera-internal-reports';

    this.logger.log(`Exporting report to gs://${bucketName}/${fileName}`);

    const dataset = this.bq.getDataset('regenera_ledger');
    const table = dataset.table('immutable_entries');

    const [job] = await table.extract(
      this.storage.bucket(bucketName).file(fileName),
      {
        format: 'CSV',
        gzip: true,
      },
    );

    this.logger.log(`Export job started: ${job?.id || 'unknown'}`);
    this.logger.log('Export job completed successfully.');
  }
}
