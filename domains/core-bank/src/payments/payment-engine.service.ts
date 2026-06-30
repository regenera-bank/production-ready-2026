import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { AccountClass } from '../accounts/account.entity';
import { AccountRepository } from '../accounts/account.repository';
import { AuditChainService } from '../audit/audit-chain.service';
import { HoldBookService } from '../holds/hold-book.service';
import { IdempotencyService } from '../idempotency/idempotency.service';
import { LedgerService } from '../ledger/ledger.service';
import { PostingSide } from '../ledger/ledger.entity';
import { Money } from '../money/money.value-object';
import { OutboxService } from '../outbox/outbox.service';
import {
  ConflictException,
  NotFoundException,
  StateTransitionException,
  ValidationException,
  isCoreBankingException,
} from '../errors/core-banking.errors';
import {
  canTransitionPayment,
  CreatePaymentCommand,
  PaymentRecord,
  PaymentStatus,
} from './payment.entity';
import { PaymentRepository } from './payment.repository';
import { ReconciliationService } from '../reconciliation/reconciliation.service';
import {
  ReconciliationCaseRecord,
  ResolveReconciliationCommand,
} from '../reconciliation/reconciliation.entity';

export type ReconcilePaymentCommand = ResolveReconciliationCommand;

@Injectable()
export class PaymentEngineService {
  private readonly createChains = new Map<string, Promise<unknown>>();

  constructor(
    private readonly payments: PaymentRepository,
    private readonly accounts: AccountRepository,
    private readonly idempotency: IdempotencyService,
    private readonly holds: HoldBookService,
    private readonly ledger: LedgerService,
    private readonly outbox: OutboxService,
    private readonly audit: AuditChainService,
    private readonly reconciliation: ReconciliationService,
  ) {}

  async create(command: CreatePaymentCommand): Promise<PaymentRecord> {
    return this.serializeByKey(command.idempotencyKey, () =>
      this.createOnce(command),
    );
  }

  private serializeByKey<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const tail = this.createChains.get(key) ?? Promise.resolve();
    const run = tail.then(fn);
    this.createChains.set(
      key,
      run.then(
        () => undefined,
        () => undefined,
      ),
    );
    return run;
  }

  private async createOnce(command: CreatePaymentCommand): Promise<PaymentRecord> {
    const payload = {
      amountCents: command.amount.toCentsString(),
      creditorAccountId: command.creditorAccountId,
      debtorAccountId: command.debtorAccountId,
    };
    const begin = await this.idempotency.begin(command.idempotencyKey, payload);

    if (begin.action === 'REPLAY') {
      return this.requirePayment(begin.responseReference);
    }

    if (begin.action === 'BLOCKED') {
      if (begin.reason === 'UNKNOWN') {
        throw new StateTransitionException(
          'UNKNOWN bloqueia retry automático de pagamento',
          'PAYMENT_UNKNOWN_BLOCKS_RETRY',
          { idempotencyKey: command.idempotencyKey },
        );
      }
      throw new ConflictException(
        'Pagamento bloqueado por idempotência',
        'PAYMENT_IDEMPOTENCY_BLOCKED',
        { idempotencyKey: command.idempotencyKey, reason: begin.reason },
      );
    }

    let holdId: string | null = null;
    try {
      const debtor = await this.requireOpenAccount(
        command.debtorAccountId,
        'PAYMENT_DEBTOR',
      );
      const creditor = await this.requireOpenAccount(
        command.creditorAccountId,
        'PAYMENT_CREDITOR',
      );
      this.assertLiabilityParticipant(debtor.accountClass, 'debtor');
      this.assertLiabilityParticipant(creditor.accountClass, 'creditor');

      if (!command.amount.isPositive()) {
        throw new ValidationException(
          'Pagamento exige valor positivo',
          'PAYMENT_INVALID_AMOUNT',
        );
      }

      const available = await this.holds.availableBalance(command.debtorAccountId);
      if (available.compare(command.amount) < 0) {
        throw new ConflictException(
          'Saldo disponível insuficiente',
          'PAYMENT_INSUFFICIENT_FUNDS',
          {
            debtorAccountId: command.debtorAccountId,
            availableCents: available.toCentsString(),
            requestedCents: command.amount.toCentsString(),
          },
        );
      }

      const paymentId = randomUUID();
      const now = new Date().toISOString();
      const hold = await this.holds.place(command.debtorAccountId, command.amount);
      holdId = hold.id;

      const payment: PaymentRecord = {
        id: paymentId,
        status: PaymentStatus.CREATED,
        debtorAccountId: command.debtorAccountId,
        creditorAccountId: command.creditorAccountId,
        amount: command.amount,
        idempotencyKey: command.idempotencyKey,
        correlationId: command.correlationId,
        journalEntryId: null,
        holdId,
        createdAt: now,
        updatedAt: now,
      };

      await this.outbox.append({
        aggregateType: 'Payment',
        aggregateId: payment.id,
        eventType: 'PaymentCreated',
        payload: {
          amountCents: payment.amount.toCentsString(),
          paymentId: payment.id,
          status: payment.status,
        },
      });

      await this.audit.append({
        eventType: 'PaymentCreated',
        payload: {
          amountCents: payment.amount.toCentsString(),
          paymentId: payment.id,
        },
        correlationId: command.correlationId,
      });

      await this.payments.save(payment);
      await this.holds.linkPayment(holdId, paymentId);
      await this.idempotency.complete(command.idempotencyKey, payment.id);
      return payment;
    } catch (error) {
      if (holdId) {
        await this.holds.release(holdId).catch(() => undefined);
      }
      if (!isCoreBankingException(error)) {
        await this.idempotency.failFinal(command.idempotencyKey).catch(() => undefined);
      } else if (
        error instanceof ValidationException ||
        error instanceof ConflictException
      ) {
        await this.idempotency.failRetryable(command.idempotencyKey).catch(
          () => undefined,
        );
      } else {
        await this.idempotency.failFinal(command.idempotencyKey).catch(() => undefined);
      }
      throw error;
    }
  }

  async markSent(paymentId: string): Promise<PaymentRecord> {
    return this.transition(paymentId, PaymentStatus.SENT);
  }

  async markSettled(paymentId: string): Promise<PaymentRecord> {
    const payment = await this.requirePayment(paymentId);
    if (payment.status !== PaymentStatus.SENT) {
      throw new StateTransitionException(
        'markSettled exige pagamento SENT',
        'PAYMENT_INVALID_SETTLE',
        { paymentId, status: payment.status },
      );
    }

    const journal = await this.postSettlement(payment);
    if (payment.holdId) {
      await this.holds.consume(payment.holdId);
    }

    return this.payments.save({
      ...payment,
      status: PaymentStatus.SETTLED,
      journalEntryId: journal.id,
      updatedAt: new Date().toISOString(),
    });
  }

  async markUnknown(paymentId: string): Promise<PaymentRecord> {
    const payment = await this.transition(paymentId, PaymentStatus.UNKNOWN);
    await this.idempotency.markPaymentUnknown(payment.idempotencyKey);
    return payment;
  }

  async openReconciliation(
    paymentId: string,
    makerId: string,
    evidenceRef: string,
  ): Promise<ReconciliationCaseRecord> {
    return this.reconciliation.open(paymentId, makerId, evidenceRef);
  }

  async reconcile(command: ReconcilePaymentCommand): Promise<PaymentRecord> {
    return this.reconciliation.resolve(command);
  }

  private async postSettlement(payment: PaymentRecord) {
    return this.ledger.post({
      correlationId: payment.correlationId,
      idempotencyKey: `settle-${payment.id}`,
      postings: [
        {
          ledgerAccountId: payment.debtorAccountId,
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.DEBIT,
          amount: payment.amount,
        },
        {
          ledgerAccountId: payment.creditorAccountId,
          accountClass: AccountClass.LIABILITY,
          side: PostingSide.CREDIT,
          amount: payment.amount,
        },
      ],
    });
  }

  private async transition(
    paymentId: string,
    target: PaymentStatus,
  ): Promise<PaymentRecord> {
    const payment = await this.requirePayment(paymentId);
    if (!canTransitionPayment(payment.status, target)) {
      throw new StateTransitionException(
        'Transição de pagamento inválida',
        'PAYMENT_INVALID_TRANSITION',
        { paymentId, from: payment.status, to: target },
      );
    }
    return this.payments.save({
      ...payment,
      status: target,
      updatedAt: new Date().toISOString(),
    });
  }

  private async requirePayment(paymentId: string): Promise<PaymentRecord> {
    const payment = await this.payments.findById(paymentId);
    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado', 'PAYMENT_NOT_FOUND', {
        paymentId,
      });
    }
    return payment;
  }

  private async requireOpenAccount(accountId: string, code: string) {
    const account = await this.accounts.findById(accountId);
    if (!account) {
      throw new NotFoundException('Conta não encontrada', `${code}_NOT_FOUND`, {
        accountId,
      });
    }
    if (!account.isOpen()) {
      throw new StateTransitionException(
        'Conta não está OPEN',
        `${code}_NOT_OPEN`,
        { accountId, status: account.status },
      );
    }
    return account;
  }

  private assertLiabilityParticipant(
    accountClass: AccountClass,
    role: 'debtor' | 'creditor',
  ): void {
    if (accountClass === AccountClass.ASSET) {
      throw new ValidationException(
        'Conta ASSET não pode participar como clearing de pagamento',
        'PAYMENT_ASSET_CLEARING_FORBIDDEN',
        { role, accountClass },
      );
    }
    if (accountClass !== AccountClass.LIABILITY) {
      throw new ValidationException(
        'Pagamento exige contas LIABILITY no core v1',
        'PAYMENT_INVALID_ACCOUNT_CLASS',
        { role, accountClass },
      );
    }
  }
}