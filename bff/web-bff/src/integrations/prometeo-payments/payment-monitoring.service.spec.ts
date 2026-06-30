import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../auth/auth.service';
import { HomologStoreService } from '../../persistence/homolog-store.service';
import { PrometeoBankingClient } from './prometeo-banking.client';
import { PrometeoPaymentsClient } from './prometeo-payments.client';
import { PaymentMonitoringService } from './payment-monitoring.service';

describe('PaymentMonitoringService', () => {
  let monitoring: PaymentMonitoringService;
  let prometeo: { fetchTransferDetail: jest.Mock; listTransfers: jest.Mock };

  beforeEach(async () => {
    process.env.HOMOLOG_STORE_MEMORY = 'true';
    process.env.PROMETEO_WEBHOOK_VERIFY_TOKEN = 'test-verify-token';

    prometeo = {
      fetchTransferDetail: jest.fn(),
      listTransfers: jest.fn(),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        HomologStoreService,
        AuthService,
        PaymentMonitoringService,
        { provide: PrometeoBankingClient, useValue: prometeo },
        {
          provide: PrometeoPaymentsClient,
          useValue: {
            resolveWidgetProductId: () => 'widget-uuid',
            createPaymentIntent: jest.fn(),
          },
        },
      ],
    }).compile();

    const store = moduleRef.get(HomologStoreService);
    store.onModuleInit();
    store.reset();
    monitoring = moduleRef.get(PaymentMonitoringService);
  });

  it('rejeita verify_token inválido', async () => {
    await expect(
      monitoring.handleWebhook({
        verify_token: 'wrong',
        events: [],
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('processa payment.success e enriquece com detalhe', async () => {
    prometeo.fetchTransferDetail.mockResolvedValue({
      request_id: 'af138fd585404dbd8327cbd475da3562',
      amount: '532',
      currency: 'UYU',
      status: 'CONFIRMED',
      concept: 'CI:49979841',
      destination_name: 'Zeus',
    });

    const result = await monitoring.handleWebhook({
      verify_token: 'test-verify-token',
      events: [
        {
          event_type: 'payment.success',
          event_id: 'evt-1',
          timestamp: '2022-11-11T02:42:36.888648',
          payload: {
            request_id: 'af138fd585404dbd8327cbd475da3562',
            amount: '532',
            currency: 'UYU',
            concept: 'CI:49979841',
            destination_owner_name: 'Zeus',
          },
        },
      ],
    });

    expect(result.processed).toBe(1);
    const stored = monitoring.getMonitored('af138fd585404dbd8327cbd475da3562');
    expect(stored?.status).toBe('ENRICHED');
    expect(stored?.transferDetail?.status).toBe('CONFIRMED');
  });
});