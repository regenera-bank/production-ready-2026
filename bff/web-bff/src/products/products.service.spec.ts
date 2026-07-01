import { Test } from '@nestjs/testing';
import { CardsModule } from '@regenera/cards';
import { InvestmentsModule } from '@regenera/investments';
import { HomologStoreService } from '../persistence/homolog-store.service';
import { ProductsService } from './products.service';

describe('ProductsService (sandbox)', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        CardsModule.register({ adapter: 'sandbox' }),
        InvestmentsModule.register({ adapter: 'sandbox' }),
      ],
      providers: [ProductsService, HomologStoreService],
    }).compile();
    service = moduleRef.get(ProductsService);
  });

  it('lista cartões sandbox para principal', async () => {
    const cards = await service.listCards('user-1');
    expect(cards.length).toBeGreaterThanOrEqual(2);
  });

  it('coloca ordem de investimento sandbox', async () => {
    const order = await service.placeInvestmentOrder(
      'user-2',
      'cdb-110',
      '10000',
      'order-key-1',
    );
    expect(order.status).toBe('filled');
    const positions = await service.getInvestmentPositions('user-2');
    expect(positions.length).toBe(1);
  });
});