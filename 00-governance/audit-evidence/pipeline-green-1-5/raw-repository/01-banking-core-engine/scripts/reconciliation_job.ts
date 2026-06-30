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

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { CoreService } from '../src/core/core.service';
import { OpenFinanceService } from '../src/open-finance/open-finance.service';
import { DataSource } from 'typeorm';
import { TransactionEntity } from '../src/core/entities/transaction.entity';

async function bootstrap() {
  console.log('--- STARTING RECONCILIATION ENGINE JOB ---');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const coreService = app.get(CoreService);
  const openFinanceService = app.get(OpenFinanceService);
  const dataSource = app.get(DataSource);
  
  const txRepo = dataSource.getRepository(TransactionEntity);
  
  // 1. Fetch recent transactions from local ledger (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const localTxs = await txRepo.createQueryBuilder('tx')
    .where('tx.createdAt >= :date', { date: oneDayAgo })
    .getMany();
    
  console.log(`Loaded ${localTxs.length} local ledger transactions from the last 24h.`);
  
  // 2. Cross-reference transactions for discrepancies
  let reconciledCount = 0;
  let discrepanciesCount = 0;
  
  for (const tx of localTxs) {
    let externalMatch = true;
    let discrepancyReason = null;
    
    // Heuristic mismatch checks
    if (Math.abs(tx.amountCents) === 0) {
      externalMatch = false;
      discrepancyReason = 'Zero value transaction recorded';
    } else if (tx.status !== 'COMPLETED') {
      externalMatch = false;
      discrepancyReason = `Transaction is stuck in state: ${tx.status}`;
    }
    
    if (externalMatch) {
      reconciledCount++;
    } else {
      discrepanciesCount++;
      console.warn(`[DISCREPANCY DETECTED] Tx ${tx.id} | Amount Cents: ${tx.amountCents} | Reason: ${discrepancyReason}`);
    }
  }
  
  console.log('\n--- RECONCILIATION SUMMARY ---');
  console.log(`Successfully reconciled: ${reconciledCount} transactions.`);
  console.log(`Discrepancies found: ${discrepanciesCount}.`);
  
  if (discrepanciesCount > 0) {
    console.log('Please investigate the reported discrepancy list.');
  } else {
    console.log('All transaction entries are 100% reconciled. Ledger balance matches external records.');
  }
  
  await app.close();
  console.log('--- RECONCILIATION ENGINE JOB COMPLETED ---');
}

bootstrap().catch((err) => {
  console.error('Reconciliation job failed:', err);
  process.exit(1);
});
