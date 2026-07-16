import { Test } from '@nestjs/testing';
import { CardsModule } from '../../cards.module';
import { CardsService } from '../../cards.service';

describe('CardsSandboxAdapter', () => {
  let service: CardsService;
  const principalId = 'user-sandbox-1';

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CardsModule.register({ adapter: 'sandbox' })],
    }).compile();
    service = moduleRef.get(CardsService);
  });

  it('lista cartões seed por principal', async () => {
    const result = await service.execute({
      idempotencyKey: 'list-1',
      principalId,
      payload: { action: 'list_cards' },
    });
    expect(result.status).toBe('ACCEPTED');
    const cards = result.metadata?.cards as Array<{ id: string }>;
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it('emite cartão físico sandbox', async () => {
    const result = await service.execute({
      idempotencyKey: 'issue-1',
      principalId,
      payload: { action: 'issue_card', alias: 'Crédito Teste', limitCents: '500000' },
    });
    expect(result.status).toBe('ACCEPTED');
    expect(result.metadata?.card).toMatchObject({ alias: 'Crédito Teste', virtual: false });
  });

  it('bloqueia e desbloqueia cartão', async () => {
    const list = await service.execute({
      idempotencyKey: 'list-2',
      principalId,
      payload: { action: 'list_cards' },
    });
    const cardId = (list.metadata?.cards as Array<{ id: string }>)[0].id;
    const blocked = await service.execute({
      idempotencyKey: 'block-1',
      principalId,
      payload: { action: 'block_card', cardId },
    });
    expect((blocked.metadata?.card as { status: string }).status).toBe('locked');
    const unblocked = await service.execute({
      idempotencyKey: 'unblock-1',
      principalId,
      payload: { action: 'unblock_card', cardId },
    });
    expect((unblocked.metadata?.card as { status: string }).status).toBe('active');
  });

  it('autoriza, captura e estorna compra', async () => {
    const list = await service.execute({
      idempotencyKey: 'list-3',
      principalId,
      payload: { action: 'list_cards' },
    });
    const cardId = (list.metadata?.cards as Array<{ id: string }>)[0].id;
    const auth = await service.execute({
      idempotencyKey: 'auth-1',
      principalId,
      payload: {
        action: 'authorize_purchase',
        cardId,
        amountCents: '1000',
        merchant: 'Loja Sandbox',
      },
    });
    expect(auth.status).toBe('ACCEPTED');
    const authId = (auth.metadata?.authorization as { authId: string }).authId;
    const capture = await service.execute({
      idempotencyKey: 'cap-1',
      principalId,
      payload: { action: 'capture_purchase', cardId, authId },
    });
    expect(capture.status).toBe('ACCEPTED');
    const reverse = await service.execute({
      idempotencyKey: 'rev-1',
      principalId,
      payload: { action: 'reverse_purchase', cardId, authId },
    });
    expect(reverse.status).toBe('ACCEPTED');
    expect((reverse.metadata?.authorization as { status: string }).status).toBe('reversed');
  });

  it('rejeita autorização acima do limite', async () => {
    const list = await service.execute({
      idempotencyKey: 'list-4',
      principalId,
      payload: { action: 'list_cards' },
    });
    const cardId = (list.metadata?.cards as Array<{ id: string }>)[0].id;
    const result = await service.execute({
      idempotencyKey: 'auth-big',
      principalId,
      payload: {
        action: 'authorize_purchase',
        cardId,
        amountCents: '999999999999',
        merchant: 'Overflow',
      },
    });
    expect(result.status).toBe('REJECTED');
    expect(result.metadata?.reason).toBe('LIMIT_EXCEEDED');
  });

  it('retorna fatura e transações', async () => {
    const list = await service.execute({
      idempotencyKey: 'list-5',
      principalId,
      payload: { action: 'list_cards' },
    });
    const cardId = (list.metadata?.cards as Array<{ id: string }>)[0].id;
    const invoice = await service.execute({
      idempotencyKey: 'inv-1',
      principalId,
      payload: { action: 'get_invoice', cardId },
    });
    expect(invoice.metadata?.invoice).toBeDefined();
    const txs = await service.execute({
      idempotencyKey: 'tx-1',
      principalId,
      payload: { action: 'list_transactions', cardId },
    });
    expect((txs.metadata?.items as unknown[]).length).toBeGreaterThan(0);
  });

  it('idempotência em issue_card', async () => {
    const command = {
      idempotencyKey: 'issue-idem',
      principalId,
      payload: { action: 'issue_card', limitCents: '100000' },
    };
    const first = await service.execute(command);
    const second = await service.execute(command);
    expect(first.referenceId).toBe(second.referenceId);
  });

  it('activation_status declara EXTERNAL_ACTIVATION_REQUIRED', async () => {
    const result = await service.execute({
      idempotencyKey: 'act-1',
      principalId,
      payload: { action: 'activation_status' },
    });
    expect(result.metadata?.externalProviderActive).toBe(false);
    expect(String(result.metadata?.message)).toContain('EXTERNAL_ACTIVATION_REQUIRED');
  });
});