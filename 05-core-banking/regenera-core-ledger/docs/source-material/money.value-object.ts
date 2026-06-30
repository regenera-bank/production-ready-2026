// money.value-object.ts
//
// dinheiro aqui é bigint em centavos. ponto final.
// float em dinheiro é o erro que todo mundo jura que não vai cometer
// e comete no terceiro sprint. esta classe existe pra tornar isso
// impossível de compilar, não pra confiar na disciplina de ninguém.

import { BadRequestException } from '@nestjs/common';

export class MoneyError extends BadRequestException {
  constructor(message: string, public readonly code: string) {
    super({ message, code, domain: 'MONEY' });
  }
}

export type CurrencyCode = 'BRL';

const CENTS_PATTERN = /^-?\d{1,19}$/;
const MAX_ABS_CENTS = 9_223_372_036_854_775_807n; // teto do BIGINT do postgres. acima disso o banco recusa, então a gente recusa antes.

export class Money {
  private constructor(
    public readonly amountCents: bigint,
    public readonly currency: CurrencyCode,
  ) {
    Object.freeze(this); // imutável. quem quiser outro valor cria outro Money.
  }

  static zero(currency: CurrencyCode = 'BRL'): Money {
    return new Money(0n, currency);
  }

  // aceita bigint, string de dígitos ou inteiro seguro.
  // 10.5 não passa. 9007199254740993 não passa. é proposital.
  static fromCents(value: bigint | string | number, currency: CurrencyCode = 'BRL'): Money {
    let cents: bigint;
    if (typeof value === 'bigint') {
      cents = value;
    } else if (typeof value === 'string') {
      const normalized = value.trim();
      if (!CENTS_PATTERN.test(normalized)) {
        throw new MoneyError(`Valor em centavos inválido: "${value}"`, 'MONEY_INVALID_CENTS');
      }
      cents = BigInt(normalized);
    } else if (typeof value === 'number') {
      if (!Number.isSafeInteger(value)) {
        throw new MoneyError(
          'Número não-inteiro ou fora da faixa segura recusado para dinheiro',
          'MONEY_FLOAT_REJECTED',
        );
      }
      cents = BigInt(value);
    } else {
      throw new MoneyError('Tipo não suportado para Money', 'MONEY_UNSUPPORTED_TYPE');
    }
    if (cents > MAX_ABS_CENTS || cents < -MAX_ABS_CENTS) {
      throw new MoneyError('Valor excede capacidade BIGINT', 'MONEY_OVERFLOW');
    }
    return new Money(cents, currency);
  }

  // "1.234,56" vira 123456n sem passar nem perto de um float.
  // o replace de milhar parece frescura até chegar entrada de usuário brasileiro.
  static parseDecimal(input: string, currency: CurrencyCode = 'BRL'): Money {
    const trimmed = input.trim().replace(/\.(?=\d{3}(\D|$))/g, '');
    const match = /^(-?)(\d+)(?:[.,](\d{1,2}))?$/.exec(trimmed);
    if (!match) {
      throw new MoneyError(`Formato decimal inválido: "${input}"`, 'MONEY_PARSE_ERROR');
    }
    const [, sign, intPart, fracPart = ''] = match;
    const cents = BigInt(intPart) * 100n + BigInt(fracPart.padEnd(2, '0'));
    return Money.fromCents(sign === '-' ? -cents : cents, currency);
  }

  toCentsString(): string {
    return this.amountCents.toString(10);
  }

  toDisplay(): string {
    const negative = this.amountCents < 0n;
    const abs = negative ? -this.amountCents : this.amountCents;
    const int = (abs / 100n).toString(10).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const frac = (abs % 100n).toString(10).padStart(2, '0');
    return `${negative ? '-' : ''}R$ ${int},${frac}`;
  }

  private assertSameCurrency(other: Money, op: string): void {
    if (this.currency !== other.currency) {
      throw new MoneyError(
        `Operação ${op} entre moedas distintas (${this.currency} vs ${other.currency})`,
        'MONEY_CURRENCY_MISMATCH',
      );
    }
  }

  add(other: Money): Money {
    this.assertSameCurrency(other, 'add');
    return Money.fromCents(this.amountCents + other.amountCents, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other, 'subtract');
    return Money.fromCents(this.amountCents - other.amountCents, this.currency);
  }

  multiplyByInt(factor: bigint | number): Money {
    const f = typeof factor === 'number' ? BigInt(Math.trunc(factor)) : factor;
    return Money.fromCents(this.amountCents * f, this.currency);
  }

  // basis points com arredondamento half-up determinístico.
  // determinístico porque auditoria refaz a conta e tem que bater byte a byte.
  percentageBps(bps: bigint): Money {
    const product = this.amountCents * bps;
    const quotient = product / 10_000n;
    const remainder = product % 10_000n;
    const rounded = remainder * 2n >= 10_000n ? quotient + 1n : quotient;
    return Money.fromCents(rounded, this.currency);
  }

  // divide sem criar nem perder centavo. o resto vai um a um pras
  // primeiras parcelas. R$ 1,00 em 3 vira 34+33+33, nunca 33,33...
  allocate(parts: number): Money[] {
    if (!Number.isInteger(parts) || parts <= 0) {
      throw new MoneyError('allocate exige inteiro positivo', 'MONEY_ALLOCATE_INVALID');
    }
    const n = BigInt(parts);
    const base = this.amountCents / n;
    let remainder = this.amountCents - base * n;
    const step = remainder >= 0n ? 1n : -1n;
    const result: Money[] = [];
    for (let i = 0; i < parts; i += 1) {
      let share = base;
      if (remainder !== 0n) {
        share += step;
        remainder -= step;
      }
      result.push(Money.fromCents(share, this.currency));
    }
    return result;
  }

  negate(): Money {
    return Money.fromCents(-this.amountCents, this.currency);
  }

  isZero(): boolean {
    return this.amountCents === 0n;
  }

  isNegative(): boolean {
    return this.amountCents < 0n;
  }

  isPositive(): boolean {
    return this.amountCents > 0n;
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.amountCents === other.amountCents;
  }

  compare(other: Money): -1 | 0 | 1 {
    this.assertSameCurrency(other, 'compare');
    if (this.amountCents < other.amountCents) return -1;
    if (this.amountCents > other.amountCents) return 1;
    return 0;
  }

  greaterThan(other: Money): boolean {
    return this.compare(other) === 1;
  }

  lessThanOrEqual(other: Money): boolean {
    return this.compare(other) <= 0;
  }

  // JSON serializa como string. number aqui seria reintroduzir o float
  // pela porta dos fundos do JSON.parse de quem consome.
  toJSON(): { amountCents: string; currency: CurrencyCode } {
    return { amountCents: this.toCentsString(), currency: this.currency };
  }
}

// transformer do typeorm: banco fala string, domínio fala Money.
// ninguém no meio do caminho vê number. é assim que se dorme à noite.
export const MoneyColumnTransformer = {
  to: (value: Money | null): string | null => (value ? value.toCentsString() : null),
  from: (value: string | null): Money | null =>
    value === null ? null : Money.fromCents(value),
};
