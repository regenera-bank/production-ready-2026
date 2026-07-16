import { AccountClass } from '../accounts/account.entity';
import { Money } from '../money/money.value-object';

export enum JournalStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
}

export enum PostingSide {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export interface PostingLineInput {
  ledgerAccountId: string;
  accountClass: AccountClass;
  side: PostingSide;
  amount: Money;
}

export interface PostJournalCommand {
  postings: PostingLineInput[];
  correlationId: string;
  idempotencyKey?: string;
  reversalOf?: string;
}

export interface PostingRecord {
  id: string;
  journalEntryId: string;
  ledgerAccountId: string;
  accountClass: AccountClass;
  side: PostingSide;
  amount: Money;
}

export interface JournalEntryRecord {
  id: string;
  status: JournalStatus;
  idempotencyKey: string | null;
  entryHash: string;
  reversalOf: string | null;
  correlationId: string;
  createdAt: string;
  postedAt: string | null;
  postings: PostingRecord[];
}