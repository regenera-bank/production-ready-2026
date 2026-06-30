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
  BadRequestException,
  OnModuleInit,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import { AccountEntity } from './entities/account.entity';
import { TransactionEntity } from './entities/transaction.entity';
import { OutboxEventEntity } from './entities/outbox-event.entity';
import { createHash } from 'crypto';
import { MetricsService } from '../metrics/metrics.service';

// Tipagem de Erros de Negócio Bancário Customizados
export class FinancialSecurityException extends HttpException {
  constructor(msg: string, code: string = 'FIN_SEC_001') {
    super({ error: code, message: msg }, HttpStatus.FORBIDDEN);
  }
}

export class InsufficientFundsException extends HttpException {
  constructor() {
    super(
      {
        error: 'INSUFFICIENT_FUNDS',
        message: 'Saldo insuficiente para a operação contábil.',
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

@Injectable()
export class CoreService implements OnModuleInit {
  private readonly logger = new Logger('LedgerCoreEngine');
  private secretsClient: SecretManagerServiceClient;

  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(TransactionEntity)
    private readonly txRepo: Repository<TransactionEntity>,
    private readonly dataSource: DataSource,
    private readonly metricsService: MetricsService,
  ) {
    this.secretsClient = new SecretManagerServiceClient();
  }

  async onModuleInit() {
    this.logger.log(
      'Inicializando Core Financeiro. Ledger ACID Ativo. Bloqueio Pessimista Habilitado.',
    );
    // Mocks de inicialização (como seed accounts fixas) foram removidos para adequação à produção real.
  }

  /**
   * Resolve e valida conta-corrente na base ACID.
   * Não cria contas sob demanda para não poluir o banco com IDs fantasmas se for ataque DDoS.
   */
  private async getActiveAccountStrict(
    neuralId: string,
  ): Promise<AccountEntity> {
    const account = await this.accountRepo.findOne({ where: { neuralId } });
    if (!account) {
      this.logger.warn(
        `Tentativa de acesso a conta inexistente ou bloqueada via neuralId: ${neuralId}`,
      );
      throw new FinancialSecurityException(
        'Conta-corrente não localizada ou bloqueada pelo BACEN.',
        'ACC_NOT_FOUND',
      );
    }
    // Verificação KYC / Status Judicial em tempo de execução
    if (
      account.status === 'BLOCKED_JUDICIAL' ||
      account.status === 'SUSPENDED'
    ) {
      throw new FinancialSecurityException(
        'Conta sob bloqueio judicial/cautelar. Operação suspensa.',
        'ACC_BLOCKED',
      );
    }
    return account;
  }

  /**
   * Motor de Transação ACID com Isolamento Pessimista de Linha (SELECT ... FOR UPDATE).
   * Garante a prevenção de problemas de concorrência e Double-Spend.
   */
  private async executeAtomicOperation<T>(
    neuralId: string,
    operation: (account: AccountEntity, queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    const isolation =
      this.dataSource.options.type === 'sqlite'
        ? 'SERIALIZABLE'
        : 'READ COMMITTED';
    await queryRunner.startTransaction(isolation); // Nível de isolamento bancário seguro para locks de linha

    try {
      const repo = queryRunner.manager.getRepository(AccountEntity);

      // Trava a linha da conta no banco de dados até o COMMIT/ROLLBACK
      let qb = repo
        .createQueryBuilder('account')
        .where('account.neuralId = :neuralId', { neuralId });
      if (this.dataSource.options.type !== 'sqlite') {
        qb = qb.setLock('pessimistic_write');
      }

      const account = await qb.getOne();

      if (!account) {
        throw new FinancialSecurityException(
          'Conta-corrente inválida para lock atômico.',
          'ACC_LOCK_FAIL',
        );
      }

      if (account.status !== 'ACTIVE') {
        throw new FinancialSecurityException(
          'Transação negada. Situação cadastral irregular.',
          'ACC_INACTIVE',
        );
      }

      const result = await operation(account, queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      this.logger.error(
        `[ROLLBACK ACIONADO] Falha atômica na conta ${neuralId}: ${error.message}`,
      );
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async createAccount(neuralId: string): Promise<AccountEntity> {
    const existing = await this.accountRepo.findOne({ where: { neuralId } });
    if (existing) return existing;
    const randomAcc = 'RG-' + Math.floor(10000000 + Math.random() * 90000000);
    const account = this.accountRepo.create({
      neuralId,
      balanceCents: 0,
      accountNumber: randomAcc,
      agency: '0001',
      status: 'ACTIVE',
    });
    return this.accountRepo.save(account);
  }

  async seedAccountBalance(neuralId: string, cents: number): Promise<void> {
    const account = await this.accountRepo.findOne({ where: { neuralId } });
    if (account) {
      account.balanceCents = cents;
      await this.accountRepo.save(account);
    }
  }

  async getDashboard(neuralId: string) {
    const account = await this.getActiveAccountStrict(neuralId);

    const recentTxs = await this.txRepo.find({
      where: { accountId: account.id },
      order: { createdAt: 'DESC' },
      take: 15,
    });

    return {
      globalBalance: Number(account.balanceCents) / 100,
      accountNumber: account.accountNumber,
      agency: account.agency,
      accountStatus: account.status,
      recentTransactions: recentTxs.map((t) => ({
        id: t.id,
        type: t.type,
        counterparty:
          t.counterpartyName || t.counterpartyKey || 'Operação Interna',
        amount: Number(t.amountCents) / 100,
        e2eId: t.endToEndId,
        settledAt: t.createdAt.toISOString(),
      })),
    };
  }

  private async recordLedgerEntry(
    queryRunner: any,
    accountId: string,
    amountCents: number,
    balanceAfterCents: number,
    type: string,
    meta?: Partial<TransactionEntity>,
  ) {
    const txRepo = queryRunner.manager.getRepository(TransactionEntity);
    const outboxRepo = queryRunner.manager.getRepository(OutboxEventEntity);
    const lastTx = await txRepo
      .createQueryBuilder('tx')
      .where('tx.accountId = :accountId', { accountId })
      .orderBy('tx.createdAt', 'DESC')
      .getOne();
    const previousHash = lastTx?.hash || 'GENESIS_HASH';
    const idempotencyKey = meta?.idempotencyKey || null;
    const createdAt = new Date();
    const rawString = `${previousHash}|${accountId}|${amountCents}|${type}|${idempotencyKey}|${createdAt.toISOString()}`;
    const hash = createHash('sha256').update(rawString).digest('hex');
    const entry = txRepo.create({
      accountId,
      amountCents,
      balanceAfterCents,
      type,
      status: 'SETTLED',
      counterpartyName: meta?.counterpartyName,
      counterpartyKey: meta?.counterpartyKey,
      endToEndId: meta?.endToEndId,
      idempotencyKey,
      previousHash,
      hash,
      createdAt,
    });
    await txRepo.save(entry);
    await outboxRepo.save(
      outboxRepo.create({
        topic: 'ledger.transaction.settled',
        payload: {
          transactionId: entry.id,
          accountId,
          amountCents,
          balanceAfterCents,
          type,
          hash,
        },
      }),
    );
    return entry;
  }

  async freezeAccount(neuralId: string, reason: string): Promise<void> {
    this.logger.warn(
      `[BLOQUEIO JUDICIAL/COMPLIANCE] Congelando conta ${neuralId}. Motivo: ${reason}`,
    );

    await this.executeAtomicOperation(
      neuralId,
      async (account, queryRunner) => {
        account.status = 'BLOCKED_JUDICIAL';
        await queryRunner.manager.getRepository(AccountEntity).save(account);

        await this.recordLedgerEntry(
          queryRunner,
          account.id,
          0,
          Number(account.balanceCents),
          'ACCOUNT_FROZEN',
          {
            counterpartyName: 'BACEN / COAF',
            endToEndId: `FREEZE_${Date.now()}`,
          },
        );

        return true;
      },
    );
  }

  async getBalance(neuralId: string) {
    const account = await this.getActiveAccountStrict(neuralId);
    return {
      globalBalance: Number(account.balanceCents) / 100,
      isLocked: account.status !== 'ACTIVE',
    };
  }

  /**
   * Débito Transacional: Redução de saldo com criação de comprovante imutável.
   */
  async debit(
    neuralId: string,
    amountCents: number,
    meta?: Partial<TransactionEntity>,
  ): Promise<number> {
    if (meta?.idempotencyKey) {
      const existing = await this.txRepo.findOne({
        where: { idempotencyKey: meta.idempotencyKey } as any,
      });
      if (existing) {
        this.logger.log(
          `[Idempotência] Requisão duplicada barrada no dédito: ${meta.idempotencyKey}`,
        );
        const acc = await this.getActiveAccountStrict(neuralId);
        return Number(acc.balanceCents) / 100;
      }
    }

    return this.executeAtomicOperation(
      neuralId,
      async (account, queryRunner) => {
        const balanceCents = Number(account.balanceCents);

        if (balanceCents < amountCents) {
          throw new InsufficientFundsException();
        }

        const newBalanceCents = balanceCents - amountCents;
        account.balanceCents = newBalanceCents;

        await queryRunner.manager.getRepository(AccountEntity).save(account);

        await this.recordLedgerEntry(
          queryRunner,
          account.id,
          -amountCents,
          newBalanceCents,
          meta?.type || 'DEBIT',
          meta,
        );

        this.metricsService.incrementLedgerDebit();

        this.logger.log(
          `[LEDGER OUT] Conta ${account.accountNumber} debitada em ${amountCents / 100}. Novo saldo: ${newBalanceCents / 100}`,
        );
        return newBalanceCents / 100;
      },
    );
  }

  /**
   * Crédito Transacional: Aumento de saldo com comprovante imutável.
   */
  async credit(
    neuralId: string,
    amountCents: number,
    meta?: Partial<TransactionEntity>,
  ): Promise<number> {
    if (meta?.idempotencyKey) {
      const existing = await this.txRepo.findOne({
        where: { idempotencyKey: meta.idempotencyKey } as any,
      });
      if (existing) {
        this.logger.log(
          `[Idempotência] Requisão duplicada barrada no crédito: ${meta.idempotencyKey}`,
        );
        const acc = await this.accountRepo.findOne({ where: { neuralId } });
        return acc ? Number(acc.balanceCents) / 100 : 0;
      }
    }

    return this.executeAtomicOperation(
      neuralId,
      async (account, queryRunner) => {
        const balanceCents = Number(account.balanceCents);

        const newBalanceCents = balanceCents + amountCents;
        account.balanceCents = newBalanceCents;

        await queryRunner.manager.getRepository(AccountEntity).save(account);

        await this.recordLedgerEntry(
          queryRunner,
          account.id,
          amountCents,
          newBalanceCents,
          meta?.type || 'CREDIT',
          meta,
        );

        this.metricsService.incrementLedgerCredit();

        this.logger.log(
          `[LEDGER IN] Conta ${account.accountNumber} creditada em ${amountCents / 100}. Novo saldo: ${newBalanceCents / 100}`,
        );
        return newBalanceCents / 100;
      },
    );
  }

  async calculateDailyVolume(accountId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const txs = await this.txRepo
      .createQueryBuilder('tx')
      .where('tx.accountId = :accountId', { accountId })
      .andWhere('tx.amountCents < 0')
      .andWhere('tx.createdAt >= :today', { today })
      .getMany();

    const volumeCents = txs.reduce(
      (sum, tx) => sum + Math.abs(Number(tx.amountCents)),
      0,
    );
    return volumeCents;
  }

  /**
   * TED Interna (Conta para Conta Regenera).
   * Ambas as pernas (Débito e Crédito) ocorrem na MESMA transação no banco.
   */
  async transfer(senderId: string, receiverId: string, amountCents: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    const isolation =
      this.dataSource.options.type === 'sqlite'
        ? 'SERIALIZABLE'
        : 'READ COMMITTED';
    await queryRunner.startTransaction(isolation);

    try {
      const accountRepo = queryRunner.manager.getRepository(AccountEntity);

      // Lock Ordenado para evitar Deadlocks (ordena IDs lexicalmente)
      const lockOrder = [senderId, receiverId].sort();

      let qbA = accountRepo
        .createQueryBuilder('a')
        .where('a.neuralId = :id', { id: lockOrder[0] });
      let qbB = accountRepo
        .createQueryBuilder('b')
        .where('b.neuralId = :id', { id: lockOrder[1] });

      if (this.dataSource.options.type !== 'sqlite') {
        qbA = qbA.setLock('pessimistic_write');
        qbB = qbB.setLock('pessimistic_write');
      }

      const accountA = await qbA.getOne();
      const accountB = await qbB.getOne();

      if (!accountA || !accountB)
        throw new FinancialSecurityException(
          'Falha de consistência: Conta de destino ou origem inválida.',
        );

      const sender = senderId === lockOrder[0] ? accountA : accountB;
      const receiver = receiverId === lockOrder[0] ? accountA : accountB;

      if (sender.status !== 'ACTIVE' || receiver.status !== 'ACTIVE') {
        throw new FinancialSecurityException(
          'Operação bloqueada. Uma das contas envolvidas está inativa.',
        );
      }

      const senderBalanceCents = Number(sender.balanceCents);

      if (senderBalanceCents < amountCents) {
        throw new InsufficientFundsException();
      }

      // Liquidação
      sender.balanceCents = senderBalanceCents - amountCents;
      receiver.balanceCents = Number(receiver.balanceCents) + amountCents;

      await accountRepo.save([sender, receiver]);

      const e2eInternal = `I${Date.now()}`;

      // Comprovantes Imutáveis
      await this.recordLedgerEntry(
        queryRunner,
        sender.id,
        -amountCents,
        sender.balanceCents,
        'INTERNAL_TED_OUT',
        { counterpartyKey: receiverId, endToEndId: e2eInternal },
      );
      await this.recordLedgerEntry(
        queryRunner,
        receiver.id,
        amountCents,
        receiver.balanceCents,
        'INTERNAL_TED_IN',
        { counterpartyKey: senderId, endToEndId: e2eInternal },
      );

      await queryRunner.commitTransaction();
      this.logger.log(
        `[TED COMPLETA] Transferência ${e2eInternal} liquidada. Valor: ${amountCents / 100}. Origem: ${senderId}`,
      );

      return {
        status: 'SETTLED_INTERNAL',
        amount: amountCents / 100,
        endToEndId: e2eInternal,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `[CRÍTICO] Falha no assentamento de TED entre ${senderId} e ${receiverId}. Rollback executado. Erro: ${error.message}`,
      );
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async executePixAtomic(
    senderNeuralId: string,
    receiverKey: string,
    amountCents: number,
    meta: {
      endToEndId: string;
      idempotencyKey?: string;
      typeOut?: string;
      typeIn?: string;
    },
  ) {
    // Delegado de Pix para TED interno caso a chave pertença a uma conta do mesmo ecossistema (Routing Inteligente)
    const isInternalRouting =
      receiverKey.includes('RG-') || receiverKey.startsWith('0001');

    if (isInternalRouting) {
      return this.transfer(senderNeuralId, receiverKey, amountCents);
    }

    // PIX SPI Externo (Apenas debita, pois o crédito é liquidado no banco de destino pelo Bacen)
    const newBalance = await this.debit(senderNeuralId, amountCents, {
      type: meta.typeOut || 'PIX_SPI_OUT',
      counterpartyKey: receiverKey,
      endToEndId: meta.endToEndId,
      idempotencyKey: meta.idempotencyKey,
    });

    return {
      status: 'DEBITED_SPI_READY',
      amount: amountCents / 100,
      senderNewBalance: newBalance,
      timestamp: new Date().toISOString(),
    };
  }

  async revealCardCvv(neuralId: string, cardId: string) {
    this.logger.log(
      `[AUDIT] Acesso autorizado ao Secret Manager via IAM: Cartão ${cardId} solicitado por ${neuralId}`,
    );
    try {
      const name = `projects/${process.env.GCP_PROJECT_ID}/secrets/CARD_CVV_${cardId}/versions/latest`;
      const [version] = await this.secretsClient.accessSecretVersion({ name });
      const payload = version.payload?.data?.toString();
      if (!payload) throw new Error('Cofre retornou payload vazio.');
      return { cvv: payload };
    } catch (error) {
      this.logger.error(
        `Vazamento prevenido ou falha de infra no cofre de segredos: ${error.message}`,
      );
      throw new FinancialSecurityException(
        'Cofre criptográfico temporariamente indisponível. Acesso bloqueado.',
      );
    }
  }
}
