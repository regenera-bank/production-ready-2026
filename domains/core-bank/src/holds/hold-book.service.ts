import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { HoldRecord, HoldStatus } from './hold.entity';
import { HoldRepository } from './hold.repository';
import { SignedBalanceProvider } from './signed-balance.provider';
import { Money } from '../money/money.value-object';
import {
  ConflictException,
  NotFoundException,
  StateTransitionException,
} from '../errors/core-banking.errors';

export interface PlaceHoldOptions {
  paymentId?: string;
  expiresAt?: Date;
}

@Injectable()
export class HoldBookService {
  constructor(
    private readonly holds: HoldRepository,
    private readonly balances: SignedBalanceProvider,
  ) {}

  async availableBalance(ledgerAccountId: string, at?: Date): Promise<Money> {
    await this.expireDue(at);
    const signed = await this.balances.signedBalance(ledgerAccountId);
    const reserved = await this.sumActiveHolds(ledgerAccountId, at);
    return signed.subtract(reserved);
  }

  async place(
    ledgerAccountId: string,
    amount: Money,
    options?: PlaceHoldOptions,
  ): Promise<HoldRecord> {
    if (!amount.isPositive()) {
      throw new ConflictException(
        'Hold exige valor positivo',
        'HOLD_INVALID_AMOUNT',
        { ledgerAccountId },
      );
    }

    const available = await this.availableBalance(ledgerAccountId);
    if (available.compare(amount) < 0) {
      throw new ConflictException(
        'Saldo disponível insuficiente para hold',
        'HOLD_INSUFFICIENT_AVAILABLE',
        {
          ledgerAccountId,
          availableCents: available.toCentsString(),
          requestedCents: amount.toCentsString(),
        },
      );
    }

    const now = new Date().toISOString();
    const hold: HoldRecord = {
      id: randomUUID(),
      ledgerAccountId,
      amount,
      status: HoldStatus.ACTIVE,
      paymentId: options?.paymentId ?? null,
      expiresAt: options?.expiresAt?.toISOString() ?? null,
      createdAt: now,
      releasedAt: null,
    };
    return this.holds.save(hold);
  }

  async consume(holdId: string): Promise<HoldRecord> {
    return this.transition(holdId, HoldStatus.CONSUMED);
  }

  async release(holdId: string): Promise<HoldRecord> {
    return this.transition(holdId, HoldStatus.RELEASED, {
      releasedAt: new Date().toISOString(),
    });
  }

  async expireDue(at: Date = new Date()): Promise<HoldRecord[]> {
    const active = await this.holds.findAllActive();
    const expired: HoldRecord[] = [];
    for (const hold of active) {
      if (hold.expiresAt && new Date(hold.expiresAt) <= at) {
        const updated = await this.holds.save({
          ...hold,
          status: HoldStatus.EXPIRED,
          releasedAt: at.toISOString(),
        });
        expired.push(updated);
      }
    }
    return expired;
  }

  private async sumActiveHolds(
    ledgerAccountId: string,
    at?: Date,
  ): Promise<Money> {
    const active = await this.holds.findActiveByAccount(ledgerAccountId);
    const reference = at ?? new Date();
    let total = Money.zero();
    for (const hold of active) {
      if (hold.expiresAt && new Date(hold.expiresAt) <= reference) {
        continue;
      }
      total = total.add(hold.amount);
    }
    return total;
  }

  private async transition(
    holdId: string,
    target: HoldStatus,
    patch?: Partial<Pick<HoldRecord, 'releasedAt'>>,
  ): Promise<HoldRecord> {
    const hold = await this.holds.findById(holdId);
    if (!hold) {
      throw new NotFoundException('Hold não encontrado', 'HOLD_NOT_FOUND', {
        holdId,
      });
    }
    if (hold.status !== HoldStatus.ACTIVE) {
      throw new StateTransitionException(
        'Hold não está ACTIVE',
        'HOLD_INVALID_TRANSITION',
        { holdId, status: hold.status, target },
      );
    }
    return this.holds.save({ ...hold, status: target, ...patch });
  }
}