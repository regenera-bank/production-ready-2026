// state-machines.ts
//
// estado não é etiqueta.
// é trilho.
//
// pix não pula fase.
// consentimento morto não volta.
// outbox entregue não ressuscita.
//
// se isso aqui aceitar caminho errado,
// o banco grava a mentira com cara de verdade.

import { ConflictException } from '@nestjs/common';

export enum PixPaymentStatus {
  CREATED = 'CREATED',
  AUTHORIZED = 'AUTHORIZED',
  DEBITED = 'DEBITED',
  SENT = 'SENT',
  SETTLED = 'SETTLED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

export enum ConsentStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export enum OutboxStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',

  // igual ao banco.
  // se a migration fala DONE e o código fala COMPLETED,
  // a fila vira teatro.
  DONE = 'DONE',

  FAILED = 'FAILED',
}

export enum LedgerDirection {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum LedgerAccountClass {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export type StateTable<S extends string> = Readonly<Record<S, readonly S[]>>;

export interface StateMachine<S extends string> {
  canTransition(from: S, to: S): boolean;
  assertTransition(from: S, to: S): void;
  nextStates(from: S): readonly S[];
  isTerminal(state: S): boolean;
}

const PIX_TRANSITIONS = {
  [PixPaymentStatus.CREATED]: [
    PixPaymentStatus.AUTHORIZED,
    PixPaymentStatus.FAILED,
  ],

  [PixPaymentStatus.AUTHORIZED]: [

    PixPaymentStatus.DEBITED,
    PixPaymentStatus.FAILED,
  ],

  [PixPaymentStatus.DEBITED]: [

    PixPaymentStatus.SENT,
    PixPaymentStatus.FAILED,
  ],

  [PixPaymentStatus.SENT]: [

    PixPaymentStatus.SETTLED,
    PixPaymentStatus.FAILED,
  ],

  // liquidou.
  // ainda pode ser revertido.
  // então não chama de terminal.
  [PixPaymentStatus.SETTLED]: [
    PixPaymentStatus.REVERSED,
  ],

  // FAILED não sai daqui.
  // ele é fechamento técnico.
  // se precisava compensar, a decisão já tinha que ter sido tomada antes.
  [PixPaymentStatus.FAILED]: [],

  // REVERSED aqui cobre duas cicatrizes:
  // reversão real de pix liquidado.
  // compensação de falha depois do débito.
  //
  // nome ruim.
  // mudar agora quebra banco.
  // então quem chama precisa saber por quê.
  [PixPaymentStatus.REVERSED]: [],
} as const satisfies StateTable<PixPaymentStatus>;

const CONSENT_TRANSITIONS = {
  [ConsentStatus.PENDING]: [
    ConsentStatus.ACTIVE,
    ConsentStatus.EXPIRED,
    ConsentStatus.REVOKED,
  ],

  [ConsentStatus.ACTIVE]: [

    ConsentStatus.EXPIRED,
    ConsentStatus.REVOKED,
  ],

  // convite de consentimento também vence.
  // pendente velho não vira ativo por acidente.
  [ConsentStatus.EXPIRED]: [],

  [ConsentStatus.REVOKED]: [],

} as const satisfies StateTable<ConsentStatus>;

const OUTBOX_TRANSITIONS = {
  [OutboxStatus.PENDING]: [
    OutboxStatus.PROCESSING,
  ],

  [OutboxStatus.PROCESSING]: [

    OutboxStatus.DONE,
    OutboxStatus.FAILED,

    ```
// volta pra PENDING só por lease vencido ou retry controlado.
// se worker vivo fizer isso no braço,
// você duplica entrega e chama de retry.
OutboxStatus.PENDING,
```

  ],

  [OutboxStatus.DONE]: [],
  [OutboxStatus.FAILED]: [

    OutboxStatus.PENDING,
  ],
} as const satisfies StateTable<OutboxStatus>;

export const NORMAL_BALANCE = {
  [LedgerAccountClass.ASSET]: LedgerDirection.DEBIT,
  [LedgerAccountClass.EXPENSE]: LedgerDirection.DEBIT,
  [LedgerAccountClass.LIABILITY]: LedgerDirection.CREDIT,
  [LedgerAccountClass.EQUITY]: LedgerDirection.CREDIT,
  [LedgerAccountClass.REVENUE]: LedgerDirection.CREDIT,
} as const satisfies Record<LedgerAccountClass, LedgerDirection>;

// falhou aqui e ainda não mexeu no ledger.
// fechar como FAILED é correto.
export const PIX_FAILURE_WITHOUT_COMPENSATION = new Set<PixPaymentStatus>([
  PixPaymentStatus.CREATED,
  PixPaymentStatus.AUTHORIZED,
]);

// falhou aqui e já mexeu no ledger.
// fechar sem compensar deixa dinheiro torto.
export const PIX_FAILURE_REQUIRING_COMPENSATION = new Set<PixPaymentStatus>([
  PixPaymentStatus.DEBITED,
  PixPaymentStatus.SENT,
]);

// terminal de verdade.
// sem próxima etapa.
export const PIX_TERMINAL_STATES = new Set<PixPaymentStatus>([
  PixPaymentStatus.FAILED,
  PixPaymentStatus.REVERSED,
]);

// sucesso de negócio.
// não é terminal técnico.
export const PIX_SETTLED_STATES = new Set<PixPaymentStatus>([
  PixPaymentStatus.SETTLED,
]);

export class IllegalStateTransitionError extends ConflictException {
  constructor(
    public readonly machine: string,
    public readonly from: string,
    public readonly to: string,
  ) {
    super({
      code: 'ILLEGAL_STATE_TRANSITION',
      machine,
      from,
      to,
      message: `${machine}: transição inválida ${from} -> ${to}`,
    });
  }
}

export class UnknownStateError extends ConflictException {
  constructor(
    public readonly machine: string,
    public readonly state: string,
  ) {
    super({
      code: 'UNKNOWN_STATE',
      machine,
      state,
      message: `${machine}: estado desconhecido ${state}`,
    });
  }
}

// sinal aqui é saldo normal da conta.
// não é regra universal de débito/crédito.
export function normalBalanceMultiplier(
  accountClass: LedgerAccountClass,
  direction: LedgerDirection,
): 1n | -1n {
  assertLedgerAccountClass(accountClass);
  assertLedgerDirection(direction);

  return NORMAL_BALANCE[accountClass] === direction ? 1n : -1n;
}

// nome antigo.
// já pode ter gente usando.
// não quebra agora só pra ficar bonito.
export function signedMultiplier(
  accountClass: LedgerAccountClass,
  direction: LedgerDirection,
): 1n | -1n {
  return normalBalanceMultiplier(accountClass, direction);
}

export function pixFailureRequiresCompensation(from: PixPaymentStatus): boolean {
  assertPixStatus(from);

  return PIX_FAILURE_REQUIRING_COMPENSATION.has(from);
}

export function pixFailureCanCloseClean(from: PixPaymentStatus): boolean {
  assertPixStatus(from);

  return PIX_FAILURE_WITHOUT_COMPENSATION.has(from);
}

export function pixFailureTargetFrom(from: PixPaymentStatus): PixPaymentStatus {
  assertPixFailureDecisionKnown(from);

  if (pixFailureRequiresCompensation(from)) {
    return PixPaymentStatus.REVERSED;
  }

  return PixPaymentStatus.FAILED;
}

export function assertPixFailureDecisionKnown(from: PixPaymentStatus): void {
  if (
    PIX_FAILURE_REQUIRING_COMPENSATION.has(from) ||
    PIX_FAILURE_WITHOUT_COMPENSATION.has(from)
  ) {
    return;
  }

  // FAILED sozinho não conta a história.
  // precisa saber de onde falhou.
  throw new IllegalStateTransitionError(
    'PixPayment',
    from,
    PixPaymentStatus.FAILED,
  );
}

export const PixStateMachine = buildStateMachine('PixPayment', PIX_TRANSITIONS);
export const ConsentStateMachine = buildStateMachine('Consent', CONSENT_TRANSITIONS);
export const OutboxStateMachine = buildStateMachine('OutboxEvent', OUTBOX_TRANSITIONS);

function buildStateMachine<S extends string>(
  machine: string,
  table: StateTable<S>,
): StateMachine<S> {
  return {
    canTransition(from: S, to: S): boolean {
      assertKnownState(machine, table, from);
      assertKnownState(machine, table, to);

      ```
  // estado desconhecido não retorna false.
  // false parece regra.
  // desconhecido é corrupção.
  return table[from].includes(to);
},

assertTransition(from: S, to: S): void {
  assertKnownState(machine, table, from);
  assertKnownState(machine, table, to);

  if (table[from].includes(to)) {
    return;
  }

  throw new IllegalStateTransitionError(machine, from, to);
},

nextStates(from: S): readonly S[] {
  assertKnownState(machine, table, from);

  return table[from];
},

isTerminal(state: S): boolean {
  assertKnownState(machine, table, state);

  return table[state].length === 0;
},
```

    };
  }

  function assertKnownState<S extends string>(
    machine: string,
    table: StateTable<S>,
    state: S,
  ): void {
    if (Object.prototype.hasOwnProperty.call(table, state)) {
      return;
    }

    throw new UnknownStateError(machine, String(state));
  }

  function assertPixStatus(status: PixPaymentStatus): void {
    if (Object.values(PixPaymentStatus).includes(status)) {
      return;
    }

    throw new UnknownStateError('PixPayment', String(status));
  }

  function assertLedgerAccountClass(accountClass: LedgerAccountClass): void {
    if (Object.values(LedgerAccountClass).includes(accountClass)) {
      return;
    }

    throw new UnknownStateError('LedgerAccountClass', String(accountClass));
  }

  function assertLedgerDirection(direction: LedgerDirection): void {
    if (Object.values(LedgerDirection).includes(direction)) {
      return;
    }

    throw new UnknownStateError('LedgerDirection', String(direction));
  }
