import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ChannelJourneyService } from '@regenera/channel-persistence';
import { DiditClient } from './didit.client';
import { DiditKycService } from './didit-kyc.service';

// C25 — DiditKycService é o caminho LEGADO. O fluxo ativo em produção é
// DiditOnboardingService (didit-onboarding.service.ts) via OnboardingService.
// Mantido por ordem do dono (não apagar); estes testes cobrem o legado.
describe('DiditKycService [LEGACY — fluxo ativo: DiditOnboardingService]', () => {
  const journeyStore = {
    get: jest.fn(),
    mutate: jest.fn((fn: (draft: { onboarding: Record<string, unknown> }) => void) => {
      const draft = { onboarding: {} as Record<string, unknown> };
      fn(draft);
      return draft;
    }),
  };

const client = {
  createSession: jest.fn(),
  getSessionDecision: jest.fn(),
};

  let service: DiditKycService;

  beforeEach(() => {
    jest.clearAllMocks();
    journeyStore.get.mockReturnValue({
      onboarding: {
        '39053344705': {
          userId: '39053344705',
          kycStatus: 'IN_REVIEW',
          accountStatus: 'NONE',
          kycStep: 'didit_verification',
        },
      },
    });
    client.createSession.mockResolvedValue({
      session_id: 'sess-1',
      session_token: 'tok',
      url: 'https://verify.didit.me/pt-BR/session/x',
      status: 'Not Started',
    });
    service = new DiditKycService(
      client as unknown as DiditClient,
      journeyStore as unknown as ChannelJourneyService,
    );
  });

  it('envia expected_document_types DL e vendor_data com sufixo CNH', async () => {
    await service.createSessionForUser('39053344705', {
      email: '39053344705@didit.pending.regenera',
      displayName: 'Pendente Didit',
      document: '39053344705',
      documentType: 'CNH',
      documentFormat: 'digital',
    });

    expect(client.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        language: 'pt-BR',
        vendorData: '39053344705::DL::digital',
        expectedDetails: expect.objectContaining({
          expected_document_types: ['DL'],
          id_country: 'BRA',
        }),
        metadata: expect.objectContaining({
          documentType: 'CNH',
          documentFormat: 'digital',
        }),
      }),
    );
  });

  it('RG usa código ID no expected_document_types', async () => {
    await service.createSessionForUser('39053344705', {
      email: 'a@b.c',
      displayName: 'Teste',
      document: '39053344705',
      documentType: 'RG',
    });

    expect(client.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        vendorData: '39053344705::ID::physical',
        expectedDetails: expect.objectContaining({
          expected_document_types: ['ID'],
        }),
      }),
    );
  });

  it('rejeita sem kycStep didit_verification', async () => {
    journeyStore.get.mockReturnValue({
      onboarding: {
        '39053344705': {
          kycStep: 'cadastral',
          kycStatus: 'PENDING',
          accountStatus: 'NONE',
        },
      },
    });

    await expect(
      service.createSessionForUser('39053344705', {
        email: 'a@b.c',
        displayName: 'Teste',
        document: '39053344705',
        documentType: 'CNH',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('webhook extrai userId de vendor_data com sufixo ::DL', async () => {
    journeyStore.get.mockReturnValue({
      onboarding: {
        '39053344705': {
          userId: '39053344705',
          kycStep: 'didit_verification',
          kycStatus: 'IN_REVIEW',
          accountStatus: 'NONE',
          diditSessionId: 'sess-old',
        },
      },
    });

    await service.applyWebhookEvent({
      webhook_type: 'status.updated',
      vendor_data: '39053344705::DL::digital',
      session_id: 'sess-new',
      status: 'In Progress',
    });

    expect(journeyStore.mutate).toHaveBeenCalled();
  });

  it('sync sem diditSessionId lança NotFoundException', async () => {
    journeyStore.get.mockReturnValue({
      onboarding: {
        '39053344705': {
          kycStep: 'didit_verification',
          kycStatus: 'IN_REVIEW',
          accountStatus: 'NONE',
        },
      },
    });

    await expect(service.syncSessionFromApi('39053344705')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});