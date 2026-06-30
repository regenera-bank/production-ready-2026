import { BadRequestException } from '@nestjs/common';

// Dinheiro não é palpite, e não é float.
// Aqui dentro dinheiro é BigInt em centavos — ou é exceção.
// Quem passa `number` pra representar centavos está abrindo um buraco
// que ninguém vê no code review e todo mundo vê na conciliação.
//
// Este arquivo é a única fonte de verdade monetária do core.
// Não existe "helper de reais" paralelo. Float morreu na porta.

export class MoneyError extends BadRequestException {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super({ message, code, domain: 'MONEY' });
  }
}

export type CurrencyCode = 'BRL';

// Centavos cabem em até 19 dígitos. Mais que isso não é saldo, é bug.
const CENTS_PATTERN = /^-?\d{1,19}$/;

// Teto físico do BIGINT do Postgres. O ledger persiste como BIGINT;
// se a aplicação aceitar além disso, o banco recusa depois — tarde demais.
// Então a recusa acontece aqui, na entrada, onde ainda dá pra explicar.
const MAX_ABS_CENTS = 9_223_372_036_854_775_807n;

export class Money {
  private constructor(
    public readonly amountCents: bigint,
    public readonly currency: CurrencyCode,
  ) {
    // Imutável de propósito. Quer outro valor? Cria outro Money.
    // Mutação silenciosa de dinheiro é como editar log de auditoria:
    // tecnicamente possível, institucionalmente proibido.
    Object.freeze(this);
  }

  static zero(currency: CurrencyCode = 'BRL'): Money {
    return new Money(0n, currency);
  }

  // Porta de entrada única. Aceita bigint, string ou number —
  // mas number só se for inteiro seguro. Float aqui é recusa, não conversão.
  static fromCents(
    value: bigint | string | number,
    currency: CurrencyCode = 'BRL',
  ): Money {
    let cents: bigint;

    if (typeof value === 'bigint') {
      cents = value;
    } else if (typeof value === 'string') {
      const normalized = value.trim();
      if (!CENTS_PATTERN.test(normalized)) {
        throw new MoneyError(
          `Valor em centavos inválido: "${value}"`,
          'MONEY_INVALID_CENTS',
        );
      }
      cents = BigInt(normalized);
    } else if (typeof value === 'number') {
      // Se chegou float, alguém calculou dinheiro errado três camadas atrás.
      // Não conserta: recusa. Perder centavo em silêncio é pior que estourar.
      if (!Number.isSafeInteger(value)) {
        throw new MoneyError(
          'Número não-inteiro ou fora da faixa segura. Recusado para não perder dinheiro.',
          'MONEY_FLOAT_REJECTED',
        );
      }
      cents = BigInt(value);
    } else {
      throw new MoneyError('Tipo inválido para Money', 'MONEY_UNSUPPORTED_TYPE');
    }

    if (cents > MAX_ABS_CENTS || cents < -MAX_ABS_CENTS) {
      throw new MoneyError(
        'Estouro do BIGINT contábil',
        'MONEY_OVERFLOW',
      );
    }

    return new Money(cents, currency);
  }

  // Parse de entrada humana: "1.234,56" ou "1234.56".
  // Milhar com ponto, decimal com vírgula ou ponto — nunca via float.
  // A string vira inteiro de centavos direto, dígito por dígito.
  static parseDecimal(input: string, currency: CurrencyCode = 'BRL'): Money {
    const trimmed = input.trim().replace(/\.(?=\d{3}(\D|$))/g, '');
    const match = /^(-?)(\d+)(?:[.,](\d{1,2}))?$/.exec(trimmed);
    if (!match) {
      throw new MoneyError(
        `Formato decimal inválido: "${input}"`,
        'MONEY_PARSE_ERROR',
      );
    }
    const [, sign, intPart, fracPart = ''] = match;
    const cents = BigInt(intPart) * 100n + BigInt(fracPart.padEnd(2, '0'));
    return Money.fromCents(sign === '-' ? -cents : cents, currency);
  }

  // Representação canônica pra persistência e contrato. Sempre centavos crus.
  toCentsString(): string {
    return this.amountCents.toString();
  }

  // Representação pra tela. Nunca use isto como input de cálculo —
  // é texto, não dinheiro.
  toDisplay(): string {
    const negative = this.amountCents < 0n;
    const abs = negative ? -this.amountCents : this.amountCents;
    const int = (abs / 100n).toString(10).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const frac = (abs % 100n).toString(10).padStart(2, '0');
    return `${negative ? '-' : ''}R$ ${int},${frac}`;
  }

  // Somar moedas diferentes não é soma, é erro de modelagem.
  // Falha alto e cedo, antes de virar saldo.
  private assertSameCurrency(other: Money, op: string): void {
    if (this.currency !== other.currency) {
      throw new MoneyError(
        `Mistura de moedas (${this.currency} vs ${other.currency}) na operação ${op}. Proibido.`,
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

  // Percentual em basis points (1 bp = 0,01%), com arredondamento
  // half-up determinístico. Determinístico é a palavra que importa:
  // o engine de JS não opina sobre o último centavo, esta função opina.
  percentageBps(bps: bigint): Money {
    const product = this.amountCents * bps;
    const quotient = product / 10_000n;
    const remainder = product % 10_000n;
    const rounded = remainder * 2n >= 10_000n ? quotient + 1n : quotient;
    return Money.fromCents(rounded, this.currency);
  }

  // Rateio sem criar nem destruir centavo. O resto da divisão vai
  // para os primeiros da fila, de forma estável. Lei de conservação:
  // a soma das partes é exatamente o todo. Sempre. Sem exceção de centavo.
  allocate(parts: number): Money[] {
    if (!Number.isInteger(parts) || parts <= 0) {
      throw new MoneyError(
        'allocate exige número de partes inteiro e positivo',
        'MONEY_ALLOCATE_INVALID',
      );
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
    return (
      this.currency === other.currency && this.amountCents === other.amountCents
    );
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

  // No contrato, dinheiro trafega como string de centavos — nunca como
  // número JSON. JSON number é float, e já estabelecemos o que float faz aqui.
  toJSON(): { amountCents: string; currency: CurrencyCode } {
    return { amountCents: this.toCentsString(), currency: this.currency };
  }
}

// Ponte com o TypeORM: a coluna é BIGINT no banco, Money na aplicação.
// A conversão acontece num lugar só, e esse lugar é este.
export const MoneyColumnTransformer = {
  to: (value: Money | null): string | null =>
    value ? value.toCentsString() : null,
  from: (value: string | null): Money | null =>
    value === null ? null : Money.fromCents(value),
};