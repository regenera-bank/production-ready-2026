import { AccountEntity } from '../core/entities/account.entity';
import { TransactionEntity } from '../core/entities/transaction.entity';
import { LedgerEntryEntity } from '../core/entities/ledger-entry.entity';

export class ReconciliationAccountDto {
  accountId: string;
  balanceCents: number;
  status: string;
}

export class ReconciliationTransactionDto {
  transactionId: string;
  accountId: string;
  amountCents: number;
  type: string;
  status: string;
}

export class ReconciliationMapper {
  static toAccountDto(account: AccountEntity): ReconciliationAccountDto {
    return {
      accountId: account.id,
      balanceCents: Number(account.balanceCents),
      status: account.status,
    };
  }

  static toTransactionDto(tx: TransactionEntity): ReconciliationTransactionDto {
    return {
      transactionId: tx.id,
      accountId: tx.accountId,
      amountCents: Number(tx.amountCents),
      type: tx.type,
      status: tx.status,
    };
  }

  static fromTransactionToLedger(tx: TransactionEntity): LedgerEntryEntity {
    const entry = new LedgerEntryEntity();
    entry.id = tx.id;
    entry.accountId = tx.accountId;
    entry.amountCents = tx.amountCents;
    entry.operation = tx.type;
    entry.idempotencyKey = tx.idempotencyKey;
    entry.previousHash = tx.previousHash;
    entry.hash = tx.hash || '';
    entry.createdAt = tx.createdAt;
    return entry;
  }
}
