import { CurrencyCode } from '../money/money.value-object';
import { StateTransitionException } from '../errors/core-banking.errors';

export enum AccountClass {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

// Alinhado a V001 account_status — três estados bastam no core v1.
// KYC/dormant ficam no domínio identity; aqui é elegibilidade para postar.
export enum AccountStatus {
  OPEN = 'OPEN',
  BLOCKED = 'BLOCKED',
  CLOSED = 'CLOSED',
}

const ALLOWED_TRANSITIONS: Readonly<Record<AccountStatus, readonly AccountStatus[]>> = {
  [AccountStatus.OPEN]: [AccountStatus.BLOCKED, AccountStatus.CLOSED],
  [AccountStatus.BLOCKED]: [AccountStatus.OPEN, AccountStatus.CLOSED],
  [AccountStatus.CLOSED]: [],
};

export interface LedgerAccountSnapshot {
  id: string;
  accountClass: AccountClass;
  currency: CurrencyCode;
  status: AccountStatus;
  externalReference: string | null;
  openedAt: string;
  closedAt: string | null;
}

export class LedgerAccount {
  private constructor(
    public readonly id: string,
    public readonly accountClass: AccountClass,
    public readonly currency: CurrencyCode,
    public readonly externalReference: string | null,
    public readonly openedAt: Date,
    private _status: AccountStatus,
    private _closedAt: Date | null,
  ) {}

  get status(): AccountStatus {
    return this._status;
  }

  get closedAt(): Date | null {
    return this._closedAt;
  }

  static open(params: {
    id: string;
    accountClass: AccountClass;
    currency?: CurrencyCode;
    externalReference?: string | null;
    openedAt?: Date;
  }): LedgerAccount {
    return new LedgerAccount(
      params.id,
      params.accountClass,
      params.currency ?? 'BRL',
      params.externalReference ?? null,
      params.openedAt ?? new Date(),
      AccountStatus.OPEN,
      null,
    );
  }

  isOpen(): boolean {
    return this._status === AccountStatus.OPEN;
  }

  isTerminal(): boolean {
    return this._status === AccountStatus.CLOSED;
  }

  transitionTo(target: AccountStatus): LedgerAccount {
    if (!LedgerAccount.canTransition(this._status, target)) {
      throw new StateTransitionException(
        `Transição de conta inválida: ${this._status} → ${target}`,
        'ACCOUNT_INVALID_TRANSITION',
        { accountId: this.id, from: this._status, to: target },
      );
    }
    const closedAt =
      target === AccountStatus.CLOSED ? new Date() : this._closedAt;
    return new LedgerAccount(
      this.id,
      this.accountClass,
      this.currency,
      this.externalReference,
      this.openedAt,
      target,
      closedAt,
    );
  }

  static canTransition(from: AccountStatus, to: AccountStatus): boolean {
    return ALLOWED_TRANSITIONS[from].includes(to);
  }

  toSnapshot(): LedgerAccountSnapshot {
    return {
      id: this.id,
      accountClass: this.accountClass,
      currency: this.currency,
      status: this._status,
      externalReference: this.externalReference,
      openedAt: this.openedAt.toISOString(),
      closedAt: this._closedAt?.toISOString() ?? null,
    };
  }
}