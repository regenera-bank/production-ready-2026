import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { AccountClass } from '../accounts/account.entity';
import { HoldBookService } from '../holds/hold-book.service';
import { LedgerService } from '../ledger/ledger.service';
import { PostingSide } from '../ledger/ledger.entity';
import {
  canTransitionPayment,
  PaymentRecord,
  PaymentStatus,
} from '../payments/payment.entity';
import { PaymentRepository } from '../payments/payment.repository';
import {
  ConflictException,
  NotFoundException,
  StateTransitionException,
  ValidationException,
} from '../errors/core-banking.errors';
import {
  ReconciliationCaseRecord,
  ReconciliationCaseStatus,
  ReconciliationResolution,
  ResolveReconciliationCommand,
} from './reconciliation.entity';
import { ReconciliationRepository } from './reconciliation.repository';

@Injectable()
export class ReconciliationService {
  constructor(
    private readonly cases: ReconciliationRepository,
    private readonly payments: PaymentRepository,
    private readonly holds: HoldBookService,
    private readonly ledger: LedgerService,
  ) {}

  async open(
    paymentId: string,
    makerId: string,
    evidenceRef: string,
  ): Promise<ReconciliationCaseRecord> {
    const payment = await this.requirePayment(paymentId);
    if (payment.status !== PaymentStatus.UNKNOWN) {
      throw new StateTransitionException(
        'Reconciliação só a partir de UNKNOWN',
        'RECONCILIATION_NOT_UNKNOWN',
        { paymentId, status: payment.status },
      );
    }

    const existing = await this.cases.findOpenByPayment(paymentId);
    if (existing) {
      throw new ConflictException(
        'Caso de reconciliação já aberto',
        'RECONCILIATION_ALREADY_OPEN',
        { paymentId, caseId: existing.id },
      );
    }

    return this.cases.save({
      id: randomUUID(),
      paymentId,
      status: ReconciliationCaseStatus.OPEN,
      evidenceRef,
      makerId,
      checkerId: null,
      createdAt: new Date().toISOString(),
      resolvedAt: null,
    });
  }

  async resolve(command: ResolveReconciliationCommand): Promise<PaymentRecord> {
    const payment = await this.requirePayment(command.paymentId);
    if (payment.status !== PaymentStatus.UNKNOWN) {
      throw new StateTransitionException(
        'resolve exige pagamento UNKNOWN',
        'RECONCILIATION_NOT_UNKNOWN',
        { paymentId: command.paymentId, status: payment.status },
      );
    }

    const openCase = await this.cases.findOpenByPayment(command.paymentId);
    if (!openCase) {
      throw new NotFoundException(
        'Caso de reconciliação aberto não encontrado',
        'RECONCILIATION_CASE_NOT_FOUND',
        { paymentId: command.paymentId },
      );
    }

    if (command.checkerId === openCase.makerId) {
      throw new ValidationException(
        'Checker deve ser distinto do maker (maker-checker)',
        'RECONCILIATION_MAKER_CHECKER',
        { makerId: openCase.makerId, checkerId: command.checkerId },
      );
    }

    if (!canTransitionPayment(payment.status, PaymentStatus.RECONCILED)) {
      throw new StateTransitionException(
        'Pagamento não pode transicionar para RECONCILED',
        'RECONCILIATION_INVALID_TRANSITION',
        { paymentId: payment.id, status: payment.status },
      );
    }

    let journalEntryId = payment.journalEntryId;
    if (command.resolution === ReconciliationResolution.SETTLED) {
      if (!journalEntryId) {
        const journal = await this.postSettlement(payment);
        journalEntryId = journal.id;
      }
      if (payment.holdId) {
        await this.holds.consume(payment.holdId);
      }
      await this.cases.save({
        ...openCase,
        status: ReconciliationCaseStatus.SETTLED,
        checkerId: command.checkerId,
        resolvedAt: new Date().toISOString(),
      });
    } else {
      if (journalEntryId) {
        await this.ledger.reverse(journalEntryId, {
          idempotencyKey: `rev-${payment.id}`,
          correlationId: payment.correlationId,
        });
        journalEntryId = null;
      }
      if (payment.holdId) {
        await this.holds.release(payment.holdId);
      }
      await this.cases.save({
        ...openCase,
        status: ReconciliationCaseStatus.REJECTED,
        checkerId: command.checkerId,
        resolvedAt: new Date().toISOString(),
      });
    }

    return this.payments.save({
      ...payment,
      status: PaymentStatus.RECONCILED,
      journalEntryId,
      updatedAt: new Date().toISOString(),
    });
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

  private async requirePayment(paymentId: string): Promise<PaymentRecord> {
    const payment = await this.payments.findById(paymentId);
    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado', 'PAYMENT_NOT_FOUND', {
        paymentId,
      });
    }
    return payment;
  }
}