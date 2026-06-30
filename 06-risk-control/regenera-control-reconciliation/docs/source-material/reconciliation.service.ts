import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { AccountEntity } from '../core/entities/account.entity';
import { TransactionEntity } from '../core/entities/transaction.entity';
import { OutboxEventEntity } from '../core/entities/outbox-event.entity';
import { MetricsService } from '../metrics/metrics.service';
import { ReconciliationRunEntity } from './entities/reconciliation-run.entity';
import { InvestmentEntity } from '../investments/entities/investment.entity';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(TransactionEntity)
    private readonly txRepo: Repository<TransactionEntity>,
    @InjectRepository(OutboxEventEntity)
    private readonly outboxRepo: Repository<OutboxEventEntity>,
    @InjectRepository(ReconciliationRunEntity)
    private readonly runRepo: Repository<ReconciliationRunEntity>,
    @InjectRepository(InvestmentEntity)
    private readonly investmentRepo: Repository<InvestmentEntity>,
    private readonly metricsService: MetricsService,
    private readonly dataSource: DataSource,
  ) {}

  @Cron(process.env.RECONCILIATION_CRON || '0 * * * *')
  async runHourlyReconciliation() {
    if (process.env.RECONCILIATION_ENABLED === 'false') {
      this.logger.log(
        'Reconciliação automática desativada (RECONCILIATION_ENABLED=false).',
      );
      return;
    }
    return this.runAutomatedReconciliation();
  }

  /**
   * Vigia do Banco: Valida o saldo da conta com a soma de todas as transações do Ledger.
   */
  async runAutomatedReconciliation() {
    const startTime = Date.now();
    this.logger.log('Iniciando conciliação automática...');
    const accounts = await this.accountRepo.find();

    for (const account of accounts) {
      const txs = await this.txRepo.find({
        where: { accountId: account.id },
      });

      const ledgerSum = txs.reduce((acc, tx) => {
        return acc + Number(tx.amountCents);
      }, 0);

      if (Number(account.balanceCents) !== ledgerSum) {
        this.logger.error(
          `[CRITICAL ALERTA VIGIA] Divergência na conta ${account.id} (Neural ID: ${account.neuralId}). Saldo: ${account.balanceCents}, Ledger: ${ledgerSum}`,
        );

        // Ação: Congelar conta
        account.status = 'FROZEN';
        await this.accountRepo.save(account);

        // Incrementar métrica
        this.metricsService.incrementLedgerBalanceDivergence();

        // Registrar no Outbox
        const outbox = this.outboxRepo.create({
          topic: 'account.frozen',
          payload: {
            accountId: account.id,
            neuralId: account.neuralId,
            reason: `Reconciliation divergence: Balance ${account.balanceCents} cents, Transaction sum ${ledgerSum} cents.`,
            timestamp: new Date().toISOString(),
          },
        });
        await this.outboxRepo.save(outbox);
      } else {
        this.logger.log(`Conta ${account.neuralId} reconciliada com sucesso.`);
      }
    }

    const durationSeconds = (Date.now() - startTime) / 1000;
    this.metricsService.setReconciliationDuration(durationSeconds);
    this.logger.log(`Conciliação finalizada em ${durationSeconds}s.`);
  }

  @Cron('30 * * * *') // Runs at minute 30
  async verifyInvestmentsConsistency() {
    const startTime = Date.now();
    let divergencesCount = 0;
    const divergencesDetails = [];

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Mock logic: check if investments match ledger
      const investments = await queryRunner.manager.find(InvestmentEntity);

      for (const inv of investments) {
        // Just an example check
        if (!inv.neural_id) {
          divergencesCount++;
          divergencesDetails.push({
            investmentId: inv.id,
            reason: 'Missing neural_id',
          });
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error verifying investments consistency', err);
    } finally {
      await queryRunner.release();
    }

    const durationMs = Date.now() - startTime;
    await this.runRepo.save({
      jobName: 'verifyInvestmentsConsistency',
      status: divergencesCount > 0 ? 'DIVERGENCE_FOUND' : 'SUCCESS',
      divergencesCount,
      divergencesDetails,
      durationMs,
    });

    if (divergencesCount > 0) {
      this.logger.error(
        `[CRITICAL] Divergence found in investments. Count: ${divergencesCount}`,
      );
      // Send metric alert
    }
  }

  @Cron('45 * * * *') // Runs at minute 45
  async verifyEventsConsistency() {
    const startTime = Date.now();
    let divergencesCount = 0;
    const divergencesDetails = [];

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const pendingEvents = await queryRunner.manager.find(OutboxEventEntity, {
        where: { status: 'PENDING' },
      });
      const staleEvents = pendingEvents.filter(
        (e) => Date.now() - new Date(e.createdAt).getTime() > 3600000,
      ); // older than 1h

      if (staleEvents.length > 0) {
        divergencesCount = staleEvents.length;
        divergencesDetails.push({
          reason: 'Stale events found',
          count: staleEvents.length,
        });
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error verifying events consistency', err);
    } finally {
      await queryRunner.release();
    }

    const durationMs = Date.now() - startTime;
    await this.runRepo.save({
      jobName: 'verifyEventsConsistency',
      status: divergencesCount > 0 ? 'DIVERGENCE_FOUND' : 'SUCCESS',
      divergencesCount,
      divergencesDetails,
      durationMs,
    });

    if (divergencesCount > 0) {
      this.logger.error(
        `[CRITICAL] Divergence found in events processing. Count: ${divergencesCount}`,
      );
      // Send metric alert
    }
  }
}
