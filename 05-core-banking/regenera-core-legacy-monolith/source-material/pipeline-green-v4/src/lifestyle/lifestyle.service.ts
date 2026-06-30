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
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW    |
|---------------------------------------------------------------------------------------|
*/

import {
  Injectable,
  Logger,
  InternalServerErrorException,
  Inject,
  forwardRef,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PubSub } from '@google-cloud/pubsub';
import {
  CoreService,
  InsufficientFundsException,
  FinancialSecurityException,
} from '../core/core.service';
import { IdempotencyService } from '../core/idempotency.service';

export interface DreamVault {
  id: string;
  name: string;
  targetCents: number;
  currentCents: number;
  progress: number;
  icon: string;
  createdAt: string;
}

@Injectable()
export class LifestyleService {
  private readonly logger = new Logger('Lifestyle_SuperApp');
  private db: admin.firestore.Firestore;
  private pubsub: PubSub;

  constructor(
    @Inject(forwardRef(() => CoreService))
    private readonly coreService: CoreService,
    private readonly idempotencyGuard: IdempotencyService,
  ) {
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    this.db = admin.firestore();
    this.pubsub = new PubSub();
  }

  /**
   * Contribuição financeira para a funcionalidade "Cofre de Sonhos".
   * Débito real no Ledger ACID e conciliação em Firestore para baixa latência de UI.
   */
  async addFundsToDream(
    neuralId: string,
    dreamId: string,
    amountCents: number,
    idempotencyKey?: string,
  ) {
    if (amountCents <= 0)
      throw new BadRequestException('Valor de contribuição deve ser positivo.');

    if (idempotencyKey) {
      const cached = await this.idempotencyGuard.get(idempotencyKey, neuralId);
      if (cached) {
        this.logger.log(
          `[IDEMPOTÊNCIA] Replay de adição de fundos barrado para a chave: ${idempotencyKey}`,
        );
        return cached.body;
      }
      await this.idempotencyGuard.acquireLock(idempotencyKey, neuralId);
    }

    const dreamRef = this.db
      .collection('users')
      .doc(neuralId)
      .collection('dreams')
      .doc(dreamId);

    try {
      // 1. Débito Financeiro Estrito no Banco Relacional ACID
      await this.coreService.debit(neuralId, amountCents, {
        type: 'DREAM_CONTRIBUTE',
        counterpartyKey: dreamId,
        endToEndId: idempotencyKey || `DREAM_${Date.now()}`,
      });

      // 2. Conciliação na Camada de Engajamento (Firestore)
      await this.db.runTransaction(async (tx) => {
        const doc = await tx.get(dreamRef);
        if (!doc.exists) {
          throw new NotFoundException(
            'Cofre não localizado. Estorno automático será acionado.',
          );
        }

        const data = doc.data() as DreamVault;
        const newCurrentCents = data.currentCents + amountCents;
        const newProgress = Math.min(
          (newCurrentCents / data.targetCents) * 100,
          100,
        );

        tx.update(dreamRef, {
          currentCents: newCurrentCents,
          progress: newProgress,
          lastUpdated: new Date().toISOString(),
        });
      });

      this.logger.log(
        `[LIFESTYLE] Contribuição liquidada: R$ ${(amountCents / 100).toFixed(2)} para o sonho ${dreamId}`,
      );

      const receipt = {
        status: 'SETTLED',
        message: 'Fundos alocados com sucesso.',
        dreamId,
      };

      if (idempotencyKey) {
        await this.idempotencyGuard.save(
          idempotencyKey,
          neuralId,
          '/lifestyle/dream-vault/contribute',
          201,
          receipt,
        );
      }
      return receipt;
    } catch (error) {
      if (idempotencyKey)
        await this.idempotencyGuard.releaseLock(idempotencyKey, neuralId);

      if (
        error instanceof InsufficientFundsException ||
        error instanceof NotFoundException ||
        error instanceof FinancialSecurityException
      ) {
        throw error;
      }

      this.logger.error(
        `[CRÍTICO LIFESTYLE] Falha ao conciliar débito do cofre: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Indisponibilidade momentânea na carteira de sonhos.',
      );
    }
  }

  /**
   * Processamento de compras no Marketplace Interno.
   * Aciona regras de negócio assíncronas via Pub/Sub (Cashback, XP).
   */
  async processMarketplacePurchase(
    neuralId: string,
    productId: string,
    idempotencyKey?: string,
  ) {
    const amountCents = 1500; // Mock amount
    if (idempotencyKey) {
      const cached = await this.idempotencyGuard.get(idempotencyKey, neuralId);
      if (cached) return cached.body;
      await this.idempotencyGuard.acquireLock(idempotencyKey, neuralId);
    }

    try {
      // 1. Débito no Ledger
      await this.coreService.debit(neuralId, amountCents, {
        type: 'MARKETPLACE_BUY',
        counterpartyKey: productId,
      });

      // 2. Disparo de Evento Assíncrono (Cashback / RevPoints)
      await this.pubsub.topic('marketplace-events').publishMessage({
        json: {
          type: 'PURCHASE_SETTLED',
          neuralId,
          productId,
          volumeCents: amountCents,
          timestamp: new Date().toISOString(),
        },
      });

      const receipt = {
        status: 'APPROVED',
        message: 'Compra processada e benefícios acionados.',
      };

      if (idempotencyKey) {
        await this.idempotencyGuard.save(
          idempotencyKey,
          neuralId,
          '/lifestyle/marketplace/buy',
          201,
          receipt,
        );
      }
      return receipt;
    } catch (error) {
      if (idempotencyKey)
        await this.idempotencyGuard.releaseLock(idempotencyKey, neuralId);
      if (
        error instanceof InsufficientFundsException ||
        error instanceof FinancialSecurityException
      ) {
        throw error;
      }

      this.logger.error(
        `[MARKETPLACE] Falha ao publicar evento de compra ou debitar ledger: ${error.message}`,
      );
      throw new InternalServerErrorException('Falha no motor do marketplace.');
    }
  }

  /**
   * Recupera a lista de Cofres de Sonhos do usuário.
   */
  async listDreams(neuralId: string): Promise<DreamVault[]> {
    try {
      const snapshot = await this.db
        .collection('users')
        .doc(neuralId)
        .collection('dreams')
        .orderBy('createdAt', 'desc')
        .get();

      if (snapshot.empty) {
        return [];
      }

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as DreamVault[];
    } catch (error) {
      this.logger.error(
        `[LIFESTYLE] Falha ao consultar cofre na base de engajamento: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Não foi possível carregar sua carteira de sonhos no momento.',
      );
    }
  }
}
