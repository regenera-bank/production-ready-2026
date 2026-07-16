import { Test } from '@nestjs/testing';
import { IntegrationsSpiModule } from './integrations-spi.module';
import { IntegrationsSpiService } from './integrations-spi.service';

describe('IntegrationsSpiService (simulator)', () => {
  let service: IntegrationsSpiService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [IntegrationsSpiModule.register({ spiAdapter: 'simulator', dictAdapter: 'simulator' })],
    }).compile();
    service = moduleRef.get(IntegrationsSpiService);
  });

  it('SPI health is ok', async () => {
    const health = await service.spiHealth();
    expect(health.ok).toBe(true);
    expect(health.rail).toBe('SPI');
  });

  it('DICT lookup is contract-faithful', async () => {
    const result = await service.lookupKey({ pixKey: 'user@bank.com', requesterIspb: '12345678' });
    expect(result.found).toBe(true);
    expect(result.pixKey).toBe('user@bank.com');
  });

  it('SPI transfer is idempotent', async () => {
    const cmd = {
      idempotencyKey: 'spi-1',
      endToEndId: 'E12345678202606301200123456789',
      amountCents: '100',
      payerIspb: '12345678',
      payeeIspb: '87654321',
    };
    const a = await service.submitTransfer(cmd);
    const b = await service.submitTransfer(cmd);
    expect(a.endToEndId).toBe(b.endToEndId);
    expect(a.status).toBe('ACCEPTED');
  });
});
