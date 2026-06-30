import {
  AccountClass,
  AccountStatus,
  LedgerAccount,
} from './account.entity';
import { AccountRegistryService } from './account-registry.service';
import { InMemoryAccountRepository } from './in-memory-account.repository';
import {
  ConflictException,
  NotFoundException,
  StateTransitionException,
} from '../errors/core-banking.errors';

describe('LedgerAccount (PR-03)', () => {
  it('open cria conta OPEN em BRL por padrão', () => {
    const account = LedgerAccount.open({
      id: 'acc-1',
      accountClass: AccountClass.LIABILITY,
    });
    expect(account.status).toBe(AccountStatus.OPEN);
    expect(account.currency).toBe('BRL');
    expect(account.isOpen()).toBe(true);
  });

  it('CLOSED é terminal', () => {
    const open = LedgerAccount.open({
      id: 'acc-2',
      accountClass: AccountClass.ASSET,
    });
    const closed = open.transitionTo(AccountStatus.CLOSED);
    expect(closed.isTerminal()).toBe(true);
    expect(() => closed.transitionTo(AccountStatus.OPEN)).toThrow(
      StateTransitionException,
    );
  });

  it('BLOCKED pode voltar a OPEN', () => {
    const open = LedgerAccount.open({
      id: 'acc-3',
      accountClass: AccountClass.LIABILITY,
    });
    const blocked = open.transitionTo(AccountStatus.BLOCKED);
    const reopened = blocked.transitionTo(AccountStatus.OPEN);
    expect(reopened.isOpen()).toBe(true);
  });
});

describe('AccountRegistryService (PR-03)', () => {
  let repo: InMemoryAccountRepository;
  let service: AccountRegistryService;

  beforeEach(() => {
    repo = new InMemoryAccountRepository();
    service = new AccountRegistryService(repo);
  });

  it('open persiste conta LIABILITY', async () => {
    const account = await service.open({
      accountClass: AccountClass.LIABILITY,
      externalReference: 'cust-100',
    });
    expect(account.accountClass).toBe(AccountClass.LIABILITY);
    expect(account.externalReference).toBe('cust-100');
    expect(account.isOpen()).toBe(true);
  });

  it('mesma externalReference → ConflictException', async () => {
    await service.open({
      accountClass: AccountClass.LIABILITY,
      externalReference: 'dup-ref',
    });
    await expect(
      service.open({
        accountClass: AccountClass.ASSET,
        externalReference: 'dup-ref',
      }),
    ).rejects.toMatchObject({ code: 'ACCOUNT_EXTERNAL_REFERENCE_EXISTS' });
  });

  it('block altera OPEN → BLOCKED', async () => {
    const open = await service.open({ accountClass: AccountClass.LIABILITY });
    const blocked = await service.block(open.id);
    expect(blocked.status).toBe(AccountStatus.BLOCKED);
  });

  it('close a partir de BLOCKED', async () => {
    const open = await service.open({ accountClass: AccountClass.LIABILITY });
    const blocked = await service.block(open.id);
    const closed = await service.close(blocked.id);
    expect(closed.status).toBe(AccountStatus.CLOSED);
    expect(closed.closedAt).not.toBeNull();
  });

  it('requireOpen em conta BLOCKED → ACCOUNT_NOT_OPEN', async () => {
    const open = await service.open({ accountClass: AccountClass.LIABILITY });
    await service.block(open.id);
    await expect(service.requireOpen(open.id)).rejects.toMatchObject({
      code: 'ACCOUNT_NOT_OPEN',
    });
  });

  it('requireOpen em conta inexistente → NotFoundException', async () => {
    await expect(service.requireOpen('missing-id')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('block em conta CLOSED → StateTransitionException', async () => {
    const open = await service.open({ accountClass: AccountClass.LIABILITY });
    await service.close(open.id);
    await expect(service.block(open.id)).rejects.toBeInstanceOf(
      StateTransitionException,
    );
  });

  it('snapshot serializa datas ISO', () => {
    const account = LedgerAccount.open({
      id: 'snap-1',
      accountClass: AccountClass.EQUITY,
    });
    const snap = account.toSnapshot();
    expect(snap.openedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(snap.closedAt).toBeNull();
  });
});