import { HoldBookService } from './hold-book.service';
import { InMemoryHoldRepository } from './in-memory-hold.repository';
import { InMemorySignedBalanceProvider } from './in-memory-signed-balance.provider';
import { Money } from '../money/money.value-object';
import { ConflictException } from '../errors/core-banking.errors';
import { HoldStatus } from './hold.entity';

describe('HoldBookService (PR-08)', () => {
  const ACCOUNT = 'ledger-acc-001';

  let holds: InMemoryHoldRepository;
  let balances: InMemorySignedBalanceProvider;
  let service: HoldBookService;

  beforeEach(() => {
    holds = new InMemoryHoldRepository();
    balances = new InMemorySignedBalanceProvider();
    service = new HoldBookService(holds, balances);
    balances.setBalance(ACCOUNT, Money.fromCents(10_000));
  });

  it('hold reduz saldo disponível', async () => {
    await service.place(ACCOUNT, Money.fromCents(3_000));
    const available = await service.availableBalance(ACCOUNT);
    expect(available.equals(Money.fromCents(7_000))).toBe(true);
  });

  it('hold acima do disponível → ConflictException', async () => {
    await expect(
      service.place(ACCOUNT, Money.fromCents(10_001)),
    ).rejects.toMatchObject({ code: 'HOLD_INSUFFICIENT_AVAILABLE' });
    await expect(
      service.place(ACCOUNT, Money.fromCents(10_001)),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('hold expirado para de reservar', async () => {
    await service.place(ACCOUNT, Money.fromCents(5_000), {
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const available = await service.availableBalance(
      ACCOUNT,
      new Date('2026-06-29T12:00:00.000Z'),
    );
    expect(available.equals(Money.fromCents(10_000))).toBe(true);
    const expired = await holds.findActiveByAccount(ACCOUNT);
    expect(expired).toHaveLength(0);
  });

  it('hold liberado restaura disponível', async () => {
    const hold = await service.place(ACCOUNT, Money.fromCents(4_000));
    expect((await service.availableBalance(ACCOUNT)).equals(Money.fromCents(6_000))).toBe(
      true,
    );
    const released = await service.release(hold.id);
    expect(released.status).toBe(HoldStatus.RELEASED);
    expect(released.releasedAt).not.toBeNull();
    expect((await service.availableBalance(ACCOUNT)).equals(Money.fromCents(10_000))).toBe(
      true,
    );
  });

  it('place com valor zero → HOLD_INVALID_AMOUNT', async () => {
    await expect(service.place(ACCOUNT, Money.zero())).rejects.toMatchObject({
      code: 'HOLD_INVALID_AMOUNT',
    });
  });

  it('hold no limite exato do disponível é aceito', async () => {
    const hold = await service.place(ACCOUNT, Money.fromCents(10_000));
    expect(hold.status).toBe(HoldStatus.ACTIVE);
    expect((await service.availableBalance(ACCOUNT)).isZero()).toBe(true);
  });
});