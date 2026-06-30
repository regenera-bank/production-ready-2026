import {
  AccountClass,
  AccountStatus,
  LedgerAccount,
} from '../../accounts/account.entity';
import { AuditEventRecord } from '../../audit/audit-chain.entity';
import { HoldRecord, HoldStatus } from '../../holds/hold.entity';
import { IdempotencyRecord, IdempotencyState } from '../../idempotency/idempotency.entity';
import {
  JournalEntryRecord,
  JournalStatus,
  PostingRecord,
  PostingSide,
} from '../../ledger/ledger.entity';
import { CurrencyCode, Money } from '../../money/money.value-object';
import { OutboxEventRecord } from '../../outbox/outbox.entity';
import { PaymentRecord, PaymentStatus } from '../../payments/payment.entity';
import { PixKeyType, PixPaymentRecord } from '../../pix/pix.entity';
import {
  ReconciliationCaseRecord,
  ReconciliationCaseStatus,
} from '../../reconciliation/reconciliation.entity';

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function mapAccountRow(row: {
  id: string;
  account_class: string;
  status: string;
  currency: string;
  external_reference: string | null;
  opened_at: Date | string;
  closed_at: Date | string | null;
}): LedgerAccount {
  let account = LedgerAccount.open({
    id: row.id,
    accountClass: row.account_class as AccountClass,
    currency: row.currency as CurrencyCode,
    externalReference: row.external_reference,
    openedAt: new Date(row.opened_at),
  });

  if (row.status === AccountStatus.BLOCKED) {
    account = account.transitionTo(AccountStatus.BLOCKED);
  } else if (row.status === AccountStatus.CLOSED) {
    account = account.transitionTo(AccountStatus.CLOSED);
  }

  return account;
}

export function mapPostingRow(row: {
  id: string;
  journal_entry_id: string;
  ledger_account_id: string;
  account_class: string;
  side: string;
  amount_minor: string | bigint;
  currency: string;
}): PostingRecord {
  return {
    id: row.id,
    journalEntryId: row.journal_entry_id,
    ledgerAccountId: row.ledger_account_id,
    accountClass: row.account_class as AccountClass,
    side: row.side as PostingSide,
    amount: Money.fromCents(row.amount_minor, row.currency as CurrencyCode),
  };
}

export function mapJournalRow(
  row: {
    id: string;
    status: string;
    idempotency_key: string | null;
    entry_hash: string;
    reversal_of: string | null;
    correlation_id: string;
    created_at: Date | string;
    posted_at: Date | string | null;
  },
  postings: PostingRecord[],
): JournalEntryRecord {
  return {
    id: row.id,
    status: row.status as JournalStatus,
    idempotencyKey: row.idempotency_key,
    entryHash: row.entry_hash,
    reversalOf: row.reversal_of,
    correlationId: row.correlation_id,
    createdAt: toIso(row.created_at),
    postedAt: row.posted_at ? toIso(row.posted_at) : null,
    postings,
  };
}

export function mapIdempotencyRow(row: {
  idempotency_key: string;
  payload_hash: string;
  state: string;
  response_reference: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}): IdempotencyRecord {
  return {
    idempotencyKey: row.idempotency_key,
    payloadHash: row.payload_hash,
    state: row.state as IdempotencyState,
    responseReference: row.response_reference,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapOutboxRow(row: {
  id: string;
  aggregate_type: string;
  aggregate_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  published_at: Date | string | null;
  created_at: Date | string;
}): OutboxEventRecord {
  return {
    id: row.id,
    aggregateType: row.aggregate_type,
    aggregateId: row.aggregate_id,
    eventType: row.event_type,
    payload: row.payload,
    publishedAt: row.published_at ? toIso(row.published_at) : null,
    createdAt: toIso(row.created_at),
  };
}

export function mapPaymentRow(
  row: {
    id: string;
    status: string;
    debtor_account_id: string;
    creditor_account_id: string;
    amount_minor: string | bigint;
    currency: string;
    idempotency_key: string;
    correlation_id: string;
    journal_entry_id: string | null;
    created_at: Date | string;
    updated_at: Date | string;
  },
  holdId: string | null = null,
): PaymentRecord {
  return {
    id: row.id,
    status: row.status as PaymentStatus,
    debtorAccountId: row.debtor_account_id,
    creditorAccountId: row.creditor_account_id,
    amount: Money.fromCents(row.amount_minor, row.currency as CurrencyCode),
    idempotencyKey: row.idempotency_key,
    correlationId: row.correlation_id,
    journalEntryId: row.journal_entry_id,
    holdId,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

export function mapHoldRow(row: {
  id: string;
  ledger_account_id: string;
  amount_minor: string | bigint;
  currency: string;
  status: string;
  payment_id: string | null;
  expires_at: Date | string | null;
  created_at: Date | string;
  released_at: Date | string | null;
}): HoldRecord {
  return {
    id: row.id,
    ledgerAccountId: row.ledger_account_id,
    amount: Money.fromCents(row.amount_minor, row.currency as CurrencyCode),
    status: row.status as HoldStatus,
    paymentId: row.payment_id,
    expiresAt: row.expires_at ? toIso(row.expires_at) : null,
    createdAt: toIso(row.created_at),
    releasedAt: row.released_at ? toIso(row.released_at) : null,
  };
}

export function mapAuditRow(row: {
  id: string | number;
  event_type: string;
  payload: Record<string, unknown>;
  previous_hash: string;
  event_hash: string;
  correlation_id: string | null;
  created_at: Date | string;
}): AuditEventRecord {
  return {
    id: Number(row.id),
    eventType: row.event_type,
    payload: row.payload,
    previousHash: row.previous_hash,
    eventHash: row.event_hash,
    correlationId: row.correlation_id,
    createdAt: toIso(row.created_at),
  };
}

export function mapReconciliationRow(row: {
  id: string;
  payment_id: string;
  status: string;
  evidence_ref: string;
  maker_id: string;
  checker_id: string | null;
  created_at: Date | string;
  resolved_at: Date | string | null;
}): ReconciliationCaseRecord {
  return {
    id: row.id,
    paymentId: row.payment_id,
    status: row.status as ReconciliationCaseStatus,
    evidenceRef: row.evidence_ref,
    makerId: row.maker_id,
    checkerId: row.checker_id,
    createdAt: toIso(row.created_at),
    resolvedAt: row.resolved_at ? toIso(row.resolved_at) : null,
  };
}

export function mapPixRow(row: {
  id: string;
  payment_id: string;
  end_to_end_id: string;
  receiver_key_hmac: string;
  receiver_masked: string;
  receiver_key_type: string;
  created_at: Date | string;
}): PixPaymentRecord {
  return {
    id: row.id,
    paymentId: row.payment_id,
    endToEndId: row.end_to_end_id,
    receiverKeyHmac: row.receiver_key_hmac,
    receiverMasked: row.receiver_masked,
    receiverKeyType: row.receiver_key_type as PixKeyType,
    createdAt: toIso(row.created_at),
  };
}