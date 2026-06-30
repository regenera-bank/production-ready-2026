/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Transaction Controller
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/transaction-service/src/transaction/transaction.controller.ts
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { TransactionService } from './transaction.service';
import { TransactionStatus, TransactionType } from './transaction.entity';

@Controller()
export class TransactionController {
  private readonly logger = new Logger(TransactionController.name);

  constructor(private readonly transactionService: TransactionService) {}

  /**
   * Listens for 'transaction_completed' events from RabbitMQ.
   * This is where settlement and reconciliation processes begin.
   */
  @EventPattern('transaction_completed')
  async handleTransactionCompleted(@Payload() data: any) {
    this.logger.log(`Received TRANSACTION_COMPLETED event: ${JSON.stringify(data)}`);

    // Create a new transaction record if one doesn't exist already (e.g., PIX service already created it)
    // For this example, we assume PIX service already created it and we just update.
    // Or, this service could be responsible for the initial creation itself.

    // Simulate creating a detailed transaction record for settlement/reconciliation
    const transaction = await this.transactionService.createTransactionRecord({
        id: data.transactionId,
        userId: data.userId,
        sourceAccountId: data.sourceAccountId,
        destinationAccountId: data.destinationAccountId,
        amountInCents: data.amountInCents,
        type: TransactionType.PIX, // Assuming it's a PIX transaction for this event
        status: TransactionStatus.COMPLETED,
        externalTransactionId: data.spiTransactionId,
    });
    this.logger.log(`Transaction record created/updated in Transaction Service: ${transaction.id}`);

    // Initiate settlement and reconciliation processes
    await this.transactionService.processSettlement(transaction.id);
    await this.transactionService.reconcileTransaction(transaction.id);

    this.logger.log(`Transaction ${transaction.id} processed for settlement and reconciliation.`);
  }
}
