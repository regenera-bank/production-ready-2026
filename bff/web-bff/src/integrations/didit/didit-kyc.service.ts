import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ChannelJourneyService } from '@regenera/channel-persistence';
import type { OnboardingRecord } from '../../onboarding/onboarding.types';
import { DiditClient } from './didit.client';
import { resolveKycFromDiditSession } from './didit-liveness.mapper';
import type { DiditSessionStatus, DiditWebhookPayload } from './didit.types';

export interface DiditSessionForUser {
  readonly sessionId: string;
  readonly sessionToken: string;
  readonly url: string;
  readonly status: DiditSessionStatus;
}

const resolveUserIdFromVendorData = (vendorData: string): string => {
  const raw = vendorData.trim();
  if (!raw) {
    return '';
  }
  const marker = raw.indexOf('::');
  return marker >= 0 ? raw.slice(0, marker) : raw;
};

const resolveBrazilianCpf = (userId: string, document?: string): string => {
  const fromDocument = (document ?? '').replace(/\D/g, '');
  const fromUserId = userId.replace(/\D/g, '');
  const cpf = (fromDocument.length === 11 ? fromDocument : fromUserId).slice(-11);
  if (cpf.length !== 11) {
    throw new BadRequestException(
      'CPF ausente na conta — saia, limpe o navegador e crie conta com CPF e senha',
    );
  }
  return cpf;
};

@Injectable()
export class DiditKycService {
  private readonly logger = new Logger(DiditKycService.name);

  constructor(
    private readonly client: DiditClient,
    private readonly journeyStore: ChannelJourneyService,
  ) {}

  isEnabled(): boolean {
    return process.env.KYC_PROVIDER?.trim().toLowerCase() === 'didit';
  }

  async createSessionForUser(
    userId: string,
    profile: {
      email: string;
      displayName: string;
      document: string;
      birthDate?: string;
      documentType: 'RG' | 'CNH';
      documentFormat?: 'physical' | 'digital';
    },
  ): Promise<DiditSessionForUser> {
    const record = this.getRecord(userId);
    if (record.kycStep !== 'didit_verification') {
      throw new BadRequestException(
        'Sessão Didit só após qualificação cadastral (kycStep=didit_verification)',
      );
    }

    const callback =
      process.env.DIDIT_SESSION_CALLBACK_URL?.trim() ||
      `${process.env.WEB_ORIGIN?.trim() || 'http://localhost:5176'}/?didit=callback`;

    const cpf = resolveBrazilianCpf(userId, profile.document);
    const diditDocCode = profile.documentType === 'CNH' ? 'DL' : 'ID';
    const expectedDetails: Record<string, unknown> = {
      identification_number: cpf,
      country: 'BRA',
      id_country: 'BRA',
      nationality: 'BRA',
      expected_document_types: [diditDocCode],
    };
    const name = profile.displayName?.trim() ?? '';
    if (name && name !== 'Pendente Didit') {
      const [firstName, ...rest] = name.split(/\s+/);
      const lastName = rest.join(' ') || firstName;
      expectedDetails.first_name = firstName;
      expectedDetails.last_name = lastName;
    }
    const birthDate = profile.birthDate?.trim();
    if (birthDate && birthDate !== '1900-01-01') {
      expectedDetails.date_of_birth = birthDate;
    }

    const recordDocType = record.diditDocumentType;
    const recordFormat = record.diditDocumentFormat;
    const formatChanged =
      profile.documentFormat &&
      recordFormat &&
      profile.documentFormat !== recordFormat;
    const typeChanged = recordDocType && recordDocType !== profile.documentType;
    const vendorData =
      typeChanged || formatChanged
        ? `${userId}::${diditDocCode}::${profile.documentFormat ?? 'physical'}::${Date.now()}`
        : `${userId}::${diditDocCode}::${profile.documentFormat ?? 'physical'}`;

    const session = await this.client.createSession({
      vendorData,
      callback,
      language: 'pt-BR',
      metadata: {
        channel: 'web-banking',
        userId,
        documentType: profile.documentType,
        documentFormat: profile.documentFormat ?? 'physical',
        diditDocumentCode: diditDocCode,
      },
      ...(profile.email && !profile.email.endsWith('@didit.pending.regenera')
        ? {
            contactEmail: profile.email,
          }
        : {}),
      expectedDetails,
    });

    const healed: OnboardingRecord = {
      ...record,
      diditSessionId: session.session_id,
      diditStatus: session.status,
      diditDocumentType: profile.documentType,
      diditDocumentFormat: profile.documentFormat ?? 'physical',
      identitySource: 'didit',
      kycStatus: 'IN_REVIEW',
    };
    this.persistRecord(userId, healed);

    return {
      sessionId: session.session_id,
      sessionToken: session.session_token ?? '',
      url: session.url,
      status: session.status,
    };
  }

  async applyWebhookEvent(payload: DiditWebhookPayload): Promise<void> {
    const eventId = String(payload.event_id ?? '').trim();
    if (eventId && this.isDuplicateEvent(eventId)) {
      this.logger.debug(`Didit webhook duplicado ignorado: ${eventId}`);
      return;
    }

    const userId = resolveUserIdFromVendorData(String(payload.vendor_data ?? ''));
    const sessionId = String(payload.session_id ?? '').trim();
    const status = payload.status as DiditSessionStatus | undefined;

    if (!userId) {
      this.logger.warn('Didit webhook sem vendor_data — ignorado');
      return;
    }

    const record = this.getRecord(userId);
    if (sessionId && record.diditSessionId && record.diditSessionId !== sessionId) {
      this.logger.warn(
        `Didit session mismatch user=${userId} stored=${record.diditSessionId} incoming=${sessionId}`,
      );
    }

    const mapped = resolveKycFromDiditSession(status);
    const healed: OnboardingRecord = {
      ...record,
      diditSessionId: sessionId || record.diditSessionId,
      diditStatus: status ?? record.diditStatus,
      kycStatus: mapped.kycStatus,
      kycStep: mapped.kycStep,
      kycReason: mapped.kycReason,
      identitySource: 'didit',
      ...(mapped.kycStatus === 'APPROVED'
        ? { kycApprovedAt: new Date().toISOString() }
        : {}),
    };
    this.persistRecord(userId, healed);

    if (eventId) {
      this.markEventProcessed(eventId);
    }
  }

  async syncSessionFromApi(userId: string): Promise<OnboardingRecord> {
    const record = this.getRecord(userId);
    if (!record.diditSessionId) {
      throw new NotFoundException('Sessão Didit não iniciada para este usuário');
    }
    const decision = await this.client.getSessionDecision(record.diditSessionId);
    const status = String(decision.status ?? record.diditStatus ?? '') as DiditSessionStatus;
    const mapped = resolveKycFromDiditSession(status, decision);
    const healed: OnboardingRecord = {
      ...record,
      diditStatus: status || record.diditStatus,
      kycStatus: mapped.kycStatus,
      kycStep: mapped.kycStep,
      kycReason: mapped.kycReason,
      ...(mapped.kycStatus === 'APPROVED'
        ? { kycApprovedAt: new Date().toISOString() }
        : {}),
    };
    this.persistRecord(userId, healed);
    return healed;
  }

  private isDuplicateEvent(eventId: string): boolean {
    const snapshot = this.journeyStore.get();
    const dedup = snapshot.diditWebhookDedup ?? {};
    return Boolean(dedup[eventId]);
  }

  private markEventProcessed(eventId: string): void {
    this.journeyStore.mutate((draft) => {
      if (!draft.diditWebhookDedup) {
        draft.diditWebhookDedup = {};
      }
      draft.diditWebhookDedup[eventId] = new Date().toISOString();
    });
  }

  private getRecord(userId: string): OnboardingRecord {
    const snapshot = this.journeyStore.get();
    const record = snapshot.onboarding[userId];
    if (!record) {
      throw new NotFoundException('Perfil de onboarding não encontrado');
    }
    return record;
  }

  private persistRecord(userId: string, record: OnboardingRecord): void {
    this.journeyStore.mutate((draft) => {
      draft.onboarding[userId] = record;
    });
  }
}