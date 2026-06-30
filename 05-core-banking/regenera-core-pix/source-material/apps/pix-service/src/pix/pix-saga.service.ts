/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - PIX SERVICE
  Module: PIX Transfers SAGA

  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky

  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] pix-saga.service.ts

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { v4 as uuidv4 } from 'uuid';
import { firstValueFrom } from 'rxjs';
// // DEV NOTE: `opossum` é uma dependência externa.
// // Adicionar ao package.json: `npm i opossum`
import * as CircuitBreaker from 'opossum';

import { CreateTransferDto } from './create-transfer.dto';

// Mock de exceções customizadas para a SAGA
export class SagaTimeoutException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SagaTimeoutException';
  }
}

@Injectable()
export class PixSagaService {
  private readonly logger = new Logger('PixSagaService');
  private readonly SAGA_TIMEOUT_MS = 15000; // 15 segundos

  // [BUG #10 CORRIGIDO] Circuit Breaker para operações de débito/crédito
  private debitCircuitBreaker: CircuitBreaker;
  private creditCircuitBreaker: CircuitBreaker;

  constructor(private readonly httpService: HttpService) {
    this.debitCircuitBreaker = new CircuitBreaker(this.debitAccountRaw.bind(this), {
      timeout: 5000,
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
    });
    this.creditCircuitBreaker = new CircuitBreaker(this.creditAccountRaw.bind(this), {
        timeout: 5000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
    });
  }

  async createPixTransferSaga(transferDto: CreateTransferDto, userId: string) {
    const sagaId = uuidv4();
    const startTime = Date.now();
    this.logger.log({ message: 'Starting PIX transfer SAGA', sagaId, userId });

    const { sourceAccountId, destinationAccountKey, amountInCents } = transferDto;

    try {
      // [BUG #9 CORRIGIDO] SAGA Steps com Idempotência e verificação de timeout
      
      // STEP 1: Validar contas (simulação)
      await this.checkTimeout(startTime, 'pre-Step 1');
      const destinationAccountId = await this.resolveDestinationAccount(destinationAccountKey);

      // STEP 2: Debitar conta de origem
      await this.checkTimeout(startTime, 'pre-Step 2');
      await this.debitAccount(sourceAccountId, amountInCents, sagaId);

      // STEP 3: Creditar conta de destino
      await this.checkTimeout(startTime, 'pre-Step 3');
      await this.creditAccount(destinationAccountId, amountInCents, sagaId);
      
      // STEP 4: Finalizar SAGA
      this.logger.log({ message: 'SAGA completed successfully', sagaId });
      return { status: 'SUCCESS', sagaId };

    } catch (error) {
      this.logger.error({ message: 'SAGA failed, starting compensation', sagaId, error: error.message });
      await this.compensate(sagaId, { sourceAccountId, amountInCents });
      throw new InternalServerErrorException(`PIX Transfer failed and was rolled back. Saga ID: ${sagaId}`);
    }
  }

  private async compensate(sagaId: string, details: { sourceAccountId: string, amountInCents: number }) {
    try {
        // Lógica de compensação: re-creditar a conta de origem
        // Esta operação também deve ser idempotente e ter seu próprio circuit breaker.
        await this.creditAccount(details.sourceAccountId, details.amountInCents, `${sagaId}-compensation`);
        this.logger.log({ message: 'SAGA compensation successful', sagaId });

    } catch (error) {
        // [BUG #7 CORRIGIDO] Tratamento robusto de falha na compensação.
        const criticalErrorPayload = {
            sagaId,
            severity: 'CRITICAL',
            requiresManualIntervention: true,
            message: 'FATAL: SAGA COMPENSATION FAILED',
            details,
            error: error.message,
        };
        this.logger.fatal(criticalErrorPayload);

        // Alerta para a equipe de operações. Em um sistema real:
        // await this.alertOps('CRITICAL', `SAGA ${sagaId} compensation failed`);
        // await this.insertPendingReconciliation(sagaId, details);
        
        // Não continuar. A partir daqui, a intervenção é manual.
        throw new Error(`Saga compensation failed - manual intervention required for Saga ID: ${sagaId}`);
    }
  }

  // Wrapper para o circuit breaker
  private async debitAccount(accountId: string, amount: number, sagaId: string) {
    return this.debitCircuitBreaker.fire(accountId, amount, sagaId);
  }
  private async creditAccount(accountId: string, amount: number, sagaId: string) {
    return this.creditCircuitBreaker.fire(accountId, amount, sagaId);
  }

  // Operações Raw (simuladas)
  private async debitAccountRaw(accountId: string, amount: number, sagaId: string) {
    // [BUG #11 CORRIGIDO] Log estruturado
    this.logger.log({ message: 'Executing debit', sagaId, accountId, amount });
    // A idempotência é garantida pelo serviço de contas, que checa o `sagaId`.
    await firstValueFrom(this.httpService.post('http://account-service/debit', { amount, sagaId }));
  }
  private async creditAccountRaw(accountId: string, amount: number, sagaId: string) {
    this.logger.log({ message: 'Executing credit', sagaId, accountId, amount });
    await firstValueFrom(this.httpService.post('http://account-service/credit', { amount, sagaId }));
  }
  private async resolveDestinationAccount(key: string): Promise<string> {
    this.logger.log({ message: 'Resolving destination account', key });
    return `resolved-account-for-${key}`;
  }

  // [BUG #8 CORRIGIDO] Verificação de timeout antes de cada passo
  private async checkTimeout(startTime: number, step: string) {
    if (Date.now() - startTime > this.SAGA_TIMEOUT_MS) {
      throw new SagaTimeoutException(`Timeout reached at ${step}`);
    }
  }
}
