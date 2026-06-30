import { Money, MoneyColumnTransformer, MoneyError } from './money.value-object';

describe('Money — invariantes obrigatórias (AGENTS.md §6)', () => {
  describe('float é recusado na entrada', () => {
    it('rejeita number não-inteiro', () => {
      expect(() => Money.fromCents(1.5)).toThrow(MoneyError);
      expect(() => Money.fromCents(1.5)).toThrow(
        expect.objectContaining({ code: 'MONEY_FLOAT_REJECTED' }),
      );
    });

    it('rejeita number fora da faixa segura', () => {
      expect(() => Money.fromCents(Number.MAX_SAFE_INTEGER + 1)).toThrow(
        expect.objectContaining({ code: 'MONEY_FLOAT_REJECTED' }),
      );
    });

    it('aceita inteiro seguro e converte para BigInt', () => {
      const money = Money.fromCents(100);
      expect(money.amountCents).toBe(100n);
    });
  });

  describe('overflow de BigInt é detectado', () => {
    const overflow = 9_223_372_036_854_775_808n;

    it('rejeita centavos acima do teto BIGINT', () => {
      expect(() => Money.fromCents(overflow)).toThrow(
        expect.objectContaining({ code: 'MONEY_OVERFLOW' }),
      );
    });

    it('rejeita centavos abaixo do piso BIGINT', () => {
      expect(() => Money.fromCents(-overflow)).toThrow(
        expect.objectContaining({ code: 'MONEY_OVERFLOW' }),
      );
    });
  });

  describe('moedas diferentes não somam', () => {
    it('add entre moedas distintas lança MONEY_CURRENCY_MISMATCH', () => {
      const a = Money.fromCents(100n);
      const b = { amountCents: 50n, currency: 'USD' } as unknown as Money;
      expect(() => a.add(b)).toThrow(
        expect.objectContaining({ code: 'MONEY_CURRENCY_MISMATCH' }),
      );
    });
  });

  describe('percentageBps é determinístico (half-away-from-zero)', () => {
    it('arredonda half-up no limite exato (5000 bps × 1 bp)', () => {
      const principal = Money.fromCents(5000n);
      expect(principal.percentageBps(1n).amountCents).toBe(1n);
    });

    it('não arredonda abaixo do limite (4999 bps × 1 bp)', () => {
      const principal = Money.fromCents(4999n);
      expect(principal.percentageBps(1n).amountCents).toBe(0n);
    });

    it('1,5% de R$ 10.000,00 = R$ 150,00', () => {
      const principal = Money.fromCents(1_000_000n);
      expect(principal.percentageBps(150n).amountCents).toBe(15_000n);
    });

    it('resultado idêntico em chamadas repetidas', () => {
      const principal = Money.fromCents(33n);
      const first = principal.percentageBps(33n).amountCents;
      const second = principal.percentageBps(33n).amountCents;
      expect(first).toBe(second);
    });
  });

  describe('allocate não cria nem destrói centavo', () => {
    it('soma das partes é exatamente o total', () => {
      const total = Money.fromCents(10n);
      const parts = total.allocate(3);
      const sum = parts.reduce((acc, p) => acc + p.amountCents, 0n);
      expect(sum).toBe(total.amountCents);
    });

    it('conserva centavos com resto indivisível', () => {
      const total = Money.fromCents(100n);
      const parts = total.allocate(3);
      const sum = parts.reduce((acc, p) => acc + p.amountCents, 0n);
      expect(sum).toBe(100n);
      expect(parts.map((p) => p.amountCents)).toEqual([34n, 33n, 33n]);
    });

    it('conserva centavos em valor negativo', () => {
      const total = Money.fromCents(-7n);
      const parts = total.allocate(3);
      const sum = parts.reduce((acc, p) => acc + p.amountCents, 0n);
      expect(sum).toBe(-7n);
    });
  });

  describe('MoneyColumnTransformer', () => {
    it('serializa centavos como string', () => {
      const money = Money.fromCents(12345n);
      expect(MoneyColumnTransformer.to(money)).toBe('12345');
    });

    it('deserializa string para Money', () => {
      const money = MoneyColumnTransformer.from('99');
      expect(money?.amountCents).toBe(99n);
    });

    it('toJSON nunca usa number', () => {
      const json = Money.fromCents(42n).toJSON();
      expect(typeof json.amountCents).toBe('string');
      expect(json.amountCents).toBe('42');
    });
  });
});