import { createHash, randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { AccountClass } from '../accounts/account.entity';
import { Money } from '../money/money.value-object';
import {
  ConflictException,
  NotFoundException,
  StateTransitionException,
  ValidationException,
} from '../errors/core-banking.errors';
import {
  JournalEntryRecord,
  JournalStatus,
  PostingLineInput,
  PostingRecord,
  PostingSide,
  PostJournalCommand,
} from './ledger.entity';
import { LedgerRepository } from './ledger.repository';

interface CanonicalPosting {
  ledgerAccountId: string;
  accountClass: AccountClass;
  side: PostingSide;
  amountCents: string;
  currency: string;
}

@Injectable()
export class LedgerService {
  constructor(private readonly repository: LedgerRepository) {}

  static canonicalPostings(postings: PostingLineInput[]): CanonicalPosting[] {
    return postings
      .map((p) => ({
        ledgerAccountId: p.ledgerAccountId,
        accountClass: p.accountClass,
        side: p.side,
        amountCents: p.amount.toCentsString(),
        currency: p.amount.currency,
      }))
      .sort((a, b) => {
        const byAccount = a.ledgerAccountId.localeCompare(b.ledgerAccountId);
        if (byAccount !== 0) return byAccount;
        const bySide = a.side.localeCompare(b.side);
        if (bySide !== 0) return bySide;
        return a.amountCents.localeCompare(b.amountCents);
      });
  }

  static postingPayloadHash(postings: PostingLineInput[]): string {
    const body = JSON.stringify(LedgerService.canonicalPostings(postings));
    return createHash('sha256').update(body, 'utf8').digest('hex');
  }

  static computeEntryHash(params: {
    id: string;
    correlationId: string;
    idempotencyKey: string | null;
    reversalOf: string | null;
    postings: PostingLineInput[];
  }): string {
    const body = JSON.stringify({
      correlationId: params.correlationId,
      id: params.id,
      idempotencyKey: params.idempotencyKey,
      postings: LedgerService.canonicalPostings(params.postings),
      reversalOf: params.reversalOf,
    });
    return createHash('sha256').update(body, 'utf8').digest('hex');
  }

  async post(command: PostJournalCommand): Promise<JournalEntryRecord> {
    this.validatePostings(command.postings);

    if (command.idempotencyKey) {
      const existing = await this.repository.findByIdempotencyKey(
        command.idempotencyKey,
      );
      if (existing) {
        const existingHash = LedgerService.postingPayloadHash(existing.postings);
        const incomingHash = LedgerService.postingPayloadHash(command.postings);
        if (existingHash !== incomingHash) {
          throw new ConflictException(
            'Mesma chave de idempotência com payload diferente',
            'LEDGER_IDEMPOTENCY_PAYLOAD_DRIFT',
            {
              idempotencyKey: command.idempotencyKey,
              expectedHash: existingHash,
              receivedHash: incomingHash,
            },
          );
        }
        return existing;
      }
    }

    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const entryHash = LedgerService.computeEntryHash({
      id,
      correlationId: command.correlationId,
      idempotencyKey: command.idempotencyKey ?? null,
      reversalOf: command.reversalOf ?? null,
      postings: command.postings,
    });

    const postings = command.postings.map((line) => this.toPostingRecord(id, line));
    const postedAt = new Date().toISOString();
    const entry: JournalEntryRecord = {
      id,
      status: JournalStatus.POSTED,
      idempotencyKey: command.idempotencyKey ?? null,
      entryHash,
      reversalOf: command.reversalOf ?? null,
      correlationId: command.correlationId,
      createdAt,
      postedAt,
      postings,
    };

    return this.repository.save(entry);
  }

  async reverse(
    originalId: string,
    command: { idempotencyKey: string; correlationId: string },
  ): Promise<JournalEntryRecord> {
    const original = await this.repository.findById(originalId);
    if (!original) {
      throw new NotFoundException('Lançamento não encontrado', 'LEDGER_NOT_FOUND', {
        journalEntryId: originalId,
      });
    }
    if (original.status !== JournalStatus.POSTED) {
      throw new StateTransitionException(
        'Reversão só permitida em lançamento POSTED',
        'LEDGER_REVERSE_NOT_POSTED',
        { journalEntryId: originalId, status: original.status },
      );
    }
    if (original.reversalOf) {
      throw new StateTransitionException(
        'Reversão de reversão proibida',
        'LEDGER_REVERSE_OF_REVERSAL',
        { journalEntryId: originalId, reversalOf: original.reversalOf },
      );
    }

    const existingReversal = await this.repository.findByReversalOf(originalId);
    if (existingReversal) {
      throw new ConflictException(
        'Lançamento já possui reversão',
        'LEDGER_ALREADY_REVERSED',
        {
          journalEntryId: originalId,
          reversalEntryId: existingReversal.id,
        },
      );
    }

    const mirrored: PostingLineInput[] = original.postings.map((p) => ({
      ledgerAccountId: p.ledgerAccountId,
      accountClass: p.accountClass,
      side: p.side === PostingSide.DEBIT ? PostingSide.CREDIT : PostingSide.DEBIT,
      amount: p.amount,
    }));

    return this.post({
      postings: mirrored,
      correlationId: command.correlationId,
      idempotencyKey: command.idempotencyKey,
      reversalOf: originalId,
    });
  }

  async signedBalance(
    ledgerAccountId: string,
    accountClass: AccountClass,
  ): Promise<Money> {
    const posted = await this.repository.findPosted();
    let total = 0n;

    for (const entry of posted) {
      for (const posting of entry.postings) {
        if (posting.ledgerAccountId !== ledgerAccountId) continue;
        const signed = LedgerService.signedContribution(
          accountClass,
          posting.side,
          posting.amount.amountCents,
        );
        total += signed;
      }
    }

    return Money.fromCents(total);
  }

  async verifyEntryHash(journalEntryId: string): Promise<boolean> {
    const entry = await this.repository.findById(journalEntryId);
    if (!entry) {
      throw new NotFoundException('Lançamento não encontrado', 'LEDGER_NOT_FOUND', {
        journalEntryId,
      });
    }

    const postings: PostingLineInput[] = entry.postings.map((p) => ({
      ledgerAccountId: p.ledgerAccountId,
      accountClass: p.accountClass,
      side: p.side,
      amount: p.amount,
    }));

    const recomputed = LedgerService.computeEntryHash({
      id: entry.id,
      correlationId: entry.correlationId,
      idempotencyKey: entry.idempotencyKey,
      reversalOf: entry.reversalOf,
      postings,
    });

    return recomputed === entry.entryHash;
  }

  private validatePostings(postings: PostingLineInput[]): void {
    if (postings.length < 2) {
      throw new ValidationException(
        'Lançamento exige ao menos duas partidas',
        'LEDGER_EMPTY_ENTRY',
        { lineCount: postings.length },
      );
    }

    const currencies = new Set(postings.map((p) => p.amount.currency));
    if (currencies.size > 1) {
      throw new ValidationException(
        'Moedas misturadas no mesmo lançamento',
        'LEDGER_MIXED_CURRENCY',
        { currencies: [...currencies] },
      );
    }

    let debitTotal = 0n;
    let creditTotal = 0n;

    for (const line of postings) {
      if (!line.amount.isPositive()) {
        throw new ValidationException(
          'Partida com valor zero ou negativo',
          'LEDGER_ZERO_LINE',
          {
            ledgerAccountId: line.ledgerAccountId,
            amountCents: line.amount.toCentsString(),
          },
        );
      }

      if (line.side === PostingSide.DEBIT) {
        debitTotal += line.amount.amountCents;
      } else {
        creditTotal += line.amount.amountCents;
      }
    }

    if (debitTotal !== creditTotal) {
      throw new ValidationException(
        'Débitos e créditos devem ser iguais antes de POSTED',
        'LEDGER_IMBALANCE',
        {
          debitCents: debitTotal.toString(),
          creditCents: creditTotal.toString(),
        },
      );
    }
  }

  private toPostingRecord(
    journalEntryId: string,
    line: PostingLineInput,
  ): PostingRecord {
    return {
      id: randomUUID(),
      journalEntryId,
      ledgerAccountId: line.ledgerAccountId,
      accountClass: line.accountClass,
      side: line.side,
      amount: line.amount,
    };
  }

  private static signedContribution(
    accountClass: AccountClass,
    side: PostingSide,
    amountCents: bigint,
  ): bigint {
    const naturalDebit =
      accountClass === AccountClass.ASSET || accountClass === AccountClass.EXPENSE;

    if (naturalDebit) {
      return side === PostingSide.DEBIT ? amountCents : -amountCents;
    }
    return side === PostingSide.CREDIT ? amountCents : -amountCents;
  }
}