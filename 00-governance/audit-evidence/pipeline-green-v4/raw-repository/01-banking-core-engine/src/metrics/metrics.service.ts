import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OutboxEventEntity } from '../core/entities/outbox-event.entity';

@Injectable()
export class MetricsService {
  private pixRequests = 0;
  private pixReplays = 0;
  private pixFailed = 0;
  private ledgerDebit = 0;
  private ledgerCredit = 0;
  private ledgerBalanceDivergence = 0;
  private idempotencyLockConflict = 0;
  private redisUnavailable = 0;
  private dbLockTimeout = 0;
  private reconciliationDuration = 0;
  private httpReqDurationSum = 0;
  private httpReqCount = 0;

  constructor(
    @InjectRepository(OutboxEventEntity)
    private readonly outboxRepo: Repository<OutboxEventEntity>,
  ) {}

  incrementPixRequests() {
    this.pixRequests++;
  }
  incrementPixReplays() {
    this.pixReplays++;
  }
  incrementPixFailed() {
    this.pixFailed++;
  }
  incrementLedgerDebit() {
    this.ledgerDebit++;
  }
  incrementLedgerCredit() {
    this.ledgerCredit++;
  }
  incrementLedgerBalanceDivergence() {
    this.ledgerBalanceDivergence++;
  }
  incrementIdempotencyLockConflict() {
    this.idempotencyLockConflict++;
  }
  incrementRedisUnavailable() {
    this.redisUnavailable++;
  }
  incrementDbLockTimeout() {
    this.dbLockTimeout++;
  }
  setReconciliationDuration(seconds: number) {
    this.reconciliationDuration = seconds;
  }

  recordHttpRequestDuration(seconds: number) {
    this.httpReqDurationSum += seconds;
    this.httpReqCount++;
  }

  async getMetricsText(): Promise<string> {
    const outboxPending = await this.outboxRepo.count({
      where: { status: 'PENDING' },
    });
    const avgDuration =
      this.httpReqCount > 0 ? this.httpReqDurationSum / this.httpReqCount : 0;

    return [
      `# HELP pix_requests_total Total number of Pix requests`,
      `# TYPE pix_requests_total counter`,
      `pix_requests_total ${this.pixRequests}`,
      ``,
      `# HELP pix_replay_total Total number of Pix replays`,
      `# TYPE pix_replay_total counter`,
      `pix_replay_total ${this.pixReplays}`,
      ``,
      `# HELP pix_failed_total Total number of Pix failures`,
      `# TYPE pix_failed_total counter`,
      `pix_failed_total ${this.pixFailed}`,
      ``,
      `# HELP ledger_debit_total Total ledger debits recorded`,
      `# TYPE ledger_debit_total counter`,
      `ledger_debit_total ${this.ledgerDebit}`,
      ``,
      `# HELP ledger_credit_total Total ledger credits recorded`,
      `# TYPE ledger_credit_total counter`,
      `ledger_credit_total ${this.ledgerCredit}`,
      ``,
      `# HELP ledger_balance_divergence_total Total number of balance divergences found`,
      `# TYPE ledger_balance_divergence_total counter`,
      `ledger_balance_divergence_total ${this.ledgerBalanceDivergence}`,
      ``,
      `# HELP reconciliation_divergence_total Total number of reconciliation divergences`,
      `# TYPE reconciliation_divergence_total counter`,
      `reconciliation_divergence_total ${this.ledgerBalanceDivergence}`,
      ``,
      `# HELP idempotency_lock_conflict_total Lock conflict count in idempotency check`,
      `# TYPE idempotency_lock_conflict_total counter`,
      `idempotency_lock_conflict_total ${this.idempotencyLockConflict}`,
      ``,
      `# HELP redis_unavailable_total Count of Redis connection failures`,
      `# TYPE redis_unavailable_total counter`,
      `redis_unavailable_total ${this.redisUnavailable}`,
      ``,
      `# HELP outbox_pending_total Count of pending events in outbox`,
      `# TYPE outbox_pending_total gauge`,
      `outbox_pending_total ${outboxPending}`,
      ``,
      `# HELP db_lock_timeout_total Total database lock timeouts encountered`,
      `# TYPE db_lock_timeout_total counter`,
      `db_lock_timeout_total ${this.dbLockTimeout}`,
      ``,
      `# HELP reconciliation_duration_seconds Duration of last reconciliation run in seconds`,
      `# TYPE reconciliation_duration_seconds gauge`,
      `reconciliation_duration_seconds ${this.reconciliationDuration}`,
      ``,
      `# HELP http_request_duration_seconds Average duration of HTTP requests in seconds`,
      `# TYPE http_request_duration_seconds gauge`,
      `http_request_duration_seconds ${avgDuration}`,
    ].join('\n');
  }
}
