/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: PIX Service - Saga Orchestrator (Stability Refactor)
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/pix-service/src/pix/pix-saga.service.ts
import { Injectable, InternalServerErrorException, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { PixTransaction } from './pix-transaction.entity';
import { Repository } from 'typeorm';
import { CentralBankService } from './central-bank.service';
import { AppConfigService } from '@repo/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PixSagaService implements OnModuleInit {
  private readonly accountServiceBaseUrl: string;
  private readonly logger = new Logger(PixSagaService.name);
  private readonly SAGA_TIMEOUT_MS = 30000;

  constructor(
    @InjectRepository(PixTransaction)
    private readonly pixRepository: Repository<PixTransaction>,
    private readonly httpService: HttpService,
    private readonly appConfigService: AppConfigService,
    @Inject('RMQ_TRANSACTION_CLIENT') private readonly client: ClientProxy,
    private readonly centralBankService: CentralBankService,
  ) {
    this.accountServiceBaseUrl = this.appConfigService.getAccountServiceUrl();
  }

  onModuleInit() {}

  async createPixTransferSaga(transferDto: CreateTransferDto, userId: string) {
    const { sourceAccountId, destinationAccountId, amountInCents } = transferDto;
    const sagaId = uuidv4();
    const startTime = Date.now();
    let sagaTransactionId: string | null = null;

    // BUG #11: Logs Estruturados. Nada de string concatenation pura.
    // Usando objeto de contexto para facilitar no Elastic/CloudWatch.
    const context = { sagaId, userId, sourceAccountId, destinationAccountId, amountInCents };
    this.logger.log({ message: "Saga PIX Started", ...context });

    try {
      // Helper para checar timeout ANTES de cada passo pesado.
      const checkTimeout = (step: string) => {
        if (Date.now() - startTime > this.SAGA_TIMEOUT_MS) {
          // BUG #8: Timeout agora aborta a execução ANTES de começar o próximo passo, 
          // evitando operações "zumbis" que rodam mas o cliente já recebeu erro.
          throw new Error(`SAGA_TIMEOUT_EXCEEDED at ${step}`);
        }
      };

      // --- Passo 1: BACEN (SPI) ---
      checkTimeout("Step 1: Central Bank");
      this.logger.log({ message: "Saga Step 1: Initiating with Central Bank", sagaId });
      const spiResponse = await this.centralBankService.initiatePixTransaction({
        amountInCents,
        sourceAccountId,
        destinationPixKey: destinationAccountId,
      });

      if (!spiResponse.success) {
        throw new Error(`SPI_FAILURE: ${spiResponse.message}`);
      }
      sagaTransactionId = spiResponse.spiTransactionId;

      // --- Passo 2: Débito ---
      checkTimeout("Step 2: Debit Source");
      this.logger.log({ message: "Saga Step 2: Debiting source account", sagaId, sourceAccountId });
      await this.debitAccount(sourceAccountId, amountInCents);

      // --- Passo 3: Crédito ---
      checkTimeout("Step 3: Credit Destination");
      this.logger.log({ message: "Saga Step 3: Crediting destination account", sagaId, destinationAccountId });
      await this.creditAccount(destinationAccountId, amountInCents);

      // --- Passo 4: Persistência ---
      checkTimeout("Step 4: Persistence");
      const transactionRecord = this.pixRepository.create({
          sourceAccountId,
          destinationAccountId,
          amountInCents,
          externalTransactionId: sagaTransactionId,
          status: 'COMPLETED'
      });
      await this.pixRepository.save(transactionRecord);

      // --- Passo 5: Notificação Event-Driven ---
      // Aqui o timeout é menos crítico pois a transação no banco já foi feita.
      this.client.emit('transaction_completed', {
        transactionId: transactionRecord.id,
        userId,
        ...context,
        timestamp: new Date().toISOString(),
      });

      this.logger.log({ message: "Saga PIX Successfully Completed", sagaId, transactionId: transactionRecord.id });
      return { status: 'completed', transactionId: transactionRecord.id };

    } catch (error) {
      // BUG #11: Log de erro estruturado.
      this.logger.error({ 
        message: "Saga PIX Failed - Starting Compensation", 
        error: error.message,
        ...context 
      });
      await this.compensateSaga(sagaId, sourceAccountId, destinationAccountId, amountInCents, sagaTransactionId);
      throw new InternalServerErrorException(`Pix Transfer Failed: ${error.message}`);
    }
  }

  private async compensateSaga(
    sagaId: string,
    sourceAccountId: string,
    destinationAccountId: string,
    amountInCents: number,
    spiTransactionId: string | null,
  ) {
    this.logger.warn({ message: "Initiating Compensation Logic", sagaId });

    // Compensar Crédito (Step 3)
    try {
      await this.debitAccount(destinationAccountId, amountInCents);
      this.logger.log({ message: "Compensation: Destination debited", sagaId, destinationAccountId });
    } catch (e) {
      this.logger.error({ message: "CRITICAL: Compensation failed for Step 3", sagaId, error: e.message });
    }

    // Compensar Débito (Step 2)
    try {
      await this.creditAccount(sourceAccountId, amountInCents);
      this.logger.log({ message: "Compensation: Source re-credited", sagaId, sourceAccountId });
    } catch (e) {
      this.logger.error({ message: "CRITICAL: Compensation failed for Step 2", sagaId, error: e.message });
    }

    // Compensar BACEN (Step 1)
    if (spiTransactionId) {
      try {
        await this.centralBankService.cancelPixTransaction(spiTransactionId);
        this.logger.log({ message: "Compensation: SPI Transaction Cancelled", sagaId, spiTransactionId });
      } catch (e) {
        this.logger.error({ message: "CRITICAL: Compensation failed for Step 1", sagaId, error: e.message });
      }
    }
  }

  private async debitAccount(accountId: string, amountInCents: number) {
    const url = `${this.accountServiceBaseUrl}/internal/accounts/${accountId}/debit`;
    return firstValueFrom(this.httpService.patch(url, { amountInCents }));
  }

  private async creditAccount(accountId: string, amountInCents: number) {
    const url = `${this.accountServiceBaseUrl}/internal/accounts/${accountId}/credit`;
    return firstValueFrom(this.httpService.patch(url, { amountInCents }));
  }
}
