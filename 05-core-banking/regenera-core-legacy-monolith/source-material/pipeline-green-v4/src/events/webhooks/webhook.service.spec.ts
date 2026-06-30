import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService } from './webhook.service';
import { ConfigService } from '@nestjs/config';
import { IdempotencyService } from '../../core/idempotency.service';
import { PixService } from '../../core/pix.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { createHmac } from 'crypto';

describe('WebhookService (Events)', () => {
  let webhookService: WebhookService;
  let idempotencyMock: jest.Mocked<IdempotencyService>;
  let pixServiceMock: jest.Mocked<PixService>;
  let configServiceMock: Partial<ConfigService>;

  const SECRET = 'test-secret';

  beforeEach(async () => {
    idempotencyMock = {
      exists: jest.fn().mockResolvedValue(false),
      lock: jest.fn().mockResolvedValue(undefined),
      unlock: jest.fn().mockResolvedValue(undefined),
      save: jest.fn().mockResolvedValue(undefined),
    } as any;

    pixServiceMock = {
      processIncomingPix: jest.fn().mockResolvedValue({}),
    } as any;

    configServiceMock = {
      get: jest.fn().mockReturnValue(SECRET),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        { provide: IdempotencyService, useValue: idempotencyMock },
        { provide: PixService, useValue: pixServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    webhookService = module.get<WebhookService>(WebhookService);
  });

  const generateValidSignature = (rawBody: string) => {
    return createHmac('sha256', SECRET).update(rawBody).digest('hex');
  };

  describe('processIncomingEvent', () => {
    it('deve rejeitar payload sem eventId', async () => {
      await expect(
        webhookService.processIncomingEvent(
          { type: 'PIX', timestamp: '123', data: {} } as any,
          'sig',
          'body',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve rejeitar assinatura HMAC inválida ou vazia', async () => {
      const payload = {
        eventId: 'evt_1',
        type: 'PIX',
        timestamp: '123',
        data: {},
      };
      const rawBody = JSON.stringify(payload);

      await expect(
        webhookService.processIncomingEvent(
          payload,
          'wrong-signature',
          rawBody,
        ),
      ).rejects.toThrow(UnauthorizedException);

      await expect(
        webhookService.processIncomingEvent(payload, '', rawBody),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('deve rejeitar e ignorar evento duplicado (Replay Attack) sem chamar o PixService', async () => {
      idempotencyMock.exists.mockResolvedValueOnce(true);

      const payload = {
        eventId: 'evt_2',
        type: 'PIX_RECEIVED',
        timestamp: '123',
        data: {},
      };
      const rawBody = JSON.stringify(payload);
      const signature = generateValidSignature(rawBody);

      const result = await webhookService.processIncomingEvent(
        payload,
        signature,
        rawBody,
      );

      expect(result.status).toBe('ALREADY_PROCESSED');
      expect(pixServiceMock.processIncomingPix).not.toHaveBeenCalled();
    });

    it('deve processar evento PIX_RECEIVED validado corretamente e delegar ao PixService', async () => {
      const payload = {
        eventId: 'evt_3',
        type: 'PIX_RECEIVED',
        timestamp: '123',
        data: { amountCents: 1000 },
      };
      const rawBody = JSON.stringify(payload);
      const signature = generateValidSignature(rawBody);

      const result = await webhookService.processIncomingEvent(
        payload,
        signature,
        rawBody,
      );

      expect(result.status).toBe('RECEIVED');
      expect(pixServiceMock.processIncomingPix).toHaveBeenCalledWith(
        payload.data,
        payload.eventId,
      );
      expect(idempotencyMock.save).toHaveBeenCalled();
    });
  });
});
