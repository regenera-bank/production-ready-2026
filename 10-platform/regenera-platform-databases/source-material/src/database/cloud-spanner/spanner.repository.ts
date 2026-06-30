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

import { Spanner } from '@google-cloud/spanner';

export class SpannerRepository {
  private spanner = new Spanner();
  private instance = this.spanner.instance(process.env.SPANNER_INSTANCE);
  private database = this.instance.database(process.env.SPANNER_DATABASE);

  async insertLedgerEntry(entry: any) {
    const table = this.database.table('GlobalLedger');
    try {
      await table.insert([entry]);
    } catch (err) {
      console.error('Spanner Insert Error:', err);
      throw err;
    }
  }

  async runTransaction(queries: any[]) {
    await this.database.runTransactionAsync(async (transaction) => {
      for (const query of queries) {
        await transaction.runUpdate(query);
      }
      await transaction.commit();
    });
  }
}
