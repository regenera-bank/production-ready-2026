import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { DiditClient } from './didit.client';
import { DiditNormalizer } from './didit-normalizer';
import { DiditWebhookVerifier } from './didit-webhook-verifier';
import type {
  DiditFrontendSessionDto,
  DiditWebhookEnvelope,
  DiditWebhookHeaders,
  NormalizedDiditKycResult,
  RegeneraDocumentFormat,
  RegeneraDocumentType,
  VerifiedDiditWebhook,
} from './didit.types';

// Adapter boundary intentionally small. Implement these methods in your
// existing OnboardingService or replace this interface with a real repository
// once Homolog leaves the critical path.
export const DIDIT_ONBOARDING_REPOSITORY = 'DIDIT_ONBOARDING_REPOSITORY';

export interface DiditOnboardingRepository {
  getStatus(userId: string): unknown;
  findUserForDidit(userId: string): {
    userId: string;
    document?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    birthDate?: string;
  } | null;
  findUserIdByDiditVendorData(vendorData: string): string | null;
  saveDiditSession(input: {
    userId: string;
    vendorData: string;
    sessionId: string;
    url: string;
    status: string;
    workflowId: string;
    workflowVersion?: number;
    documentType: RegeneraDocumentType;
    documentFormat: RegeneraDocumentFormat;
  }): unknown;
  applyDiditResult(input: {
    userId: string;
    eventId: string;
    result: NormalizedDiditKycResult;
  }): unknown;
}

@Injectable()
export class DiditOnboardingService {
  private readonly logger = new Logger(DiditOnboardingService.name);
  private readonly normalizer = new DiditNormalizer();

  constructor(
    private readonly didit: DiditClient,
    private readonly verifier: DiditWebhookVerifier,
    @Inject(DIDIT_ONBOARDING_REPOSITORY)
    private readonly repo: DiditOnboardingRepository,
  ) {}

  async createSession(input: {
    userId: string;
    callback: string;
    documentType: RegeneraDocumentType;
    documentFormat: RegeneraDocumentFormat;
    language?: string;
    correlationId?: string;
  }): Promise<DiditFrontendSessionDto> {
    const user = this.repo.findUserForDidit(input.userId);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    const vendorData = this.vendorDataFor(user.userId);
    const expectedDetails = this.expectedDetails(user, input.documentType);

    const session = await this.didit.createSession({
      vendorData,
      callback: input.callback,
      callbackMethod: 'both',
      language: input.language ?? 'pt-BR',
      contactEmail: user.email,
      contactPhone: user.phone,
      sendNotificationEmails: false,
      expectedDetails,
      metadata: {
        journey: 'account_opening',
        channel: 'web',
        regenera_user_id: user.userId,
      },
      documentType: input.documentType,
      documentFormat: input.documentFormat,
      correlationId: input.correlationId,
    });

    const statusResponse = this.repo.saveDiditSession({
      userId: input.userId,
      vendorData,
      sessionId: session.session_id,
      url: session.url,
      status: session.status,
      workflowId: session.workflow_id,
      workflowVersion: session.workflow_version,
      documentType: input.documentType,
      documentFormat: input.documentFormat,
    });

    return {
      provider: 'DIDIT',
      sessionId: session.session_id,
      url: session.url,
      status: session.status,
      statusResponse,
    };
  }

  async syncStatus(userId: string, correlationId?: string): Promise<unknown> {
    const user = this.repo.findUserForDidit(userId);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    const status = this.repo.getStatus(userId) as { diditSessionId?: string };
    if (!status?.diditSessionId) {
      throw new BadRequestException('DIDIT_SESSION_NOT_STARTED');
    }

    const report = await this.didit.getSessionDecision(status.diditSessionId, correlationId);
    const result = this.normalizer.fromRetrieveSession(report);
    return this.repo.applyDiditResult({
      userId,
      eventId: `sync:${report.session_id}:${Date.now()}`,
      result,
    });
  }

  async handleWebhook(input: {
    payload: DiditWebhookEnvelope;
    rawBody?: Buffer | string;
    headers: DiditWebhookHeaders;
  }): Promise<{ accepted: true; eventId: string; trust: string; sessionId?: string }> {
    const verified = this.verifier.verify(input);
    const result = await this.resultFromWebhook(verified);
    const vendorData = verified.payload.vendor_data ?? result.vendorData;

    if (!vendorData) {
      this.logger.warn(`Didit webhook without vendor_data eventId=${verified.eventId}`);
      return { accepted: true, eventId: verified.eventId, trust: verified.trust, sessionId: verified.sessionId };
    }

    const userId = this.repo.findUserIdByDiditVendorData(vendorData);
    if (!userId) {
      this.logger.warn(`Didit webhook for unknown vendor_data eventId=${verified.eventId}`);
      return { accepted: true, eventId: verified.eventId, trust: verified.trust, sessionId: verified.sessionId };
    }

    this.repo.applyDiditResult({ userId, eventId: verified.eventId, result });
    return { accepted: true, eventId: verified.eventId, trust: verified.trust, sessionId: verified.sessionId };
  }

  private async resultFromWebhook(verified: VerifiedDiditWebhook): Promise<NormalizedDiditKycResult> {
    const fromEnvelope = this.normalizer.fromWebhook(verified.payload, verified.trust);

    // If signature was Simple, the decision data is envelope-only and must not be
    // trusted. For terminal statuses, fetch the canonical report too.
    if (fromEnvelope.requiresRefetch && verified.sessionId) {
      try {
        const report = await this.didit.getSessionDecision(verified.sessionId, verified.eventId);
        return this.normalizer.fromRetrieveSession(report);
      } catch (error) {
        this.logger.warn(
          `Didit report refetch failed eventId=${verified.eventId} sessionId=${verified.sessionId} error=${error instanceof Error ? error.message : 'unknown'}`,
        );
      }
    }

    return fromEnvelope;
  }

  private vendorDataFor(userId: string): string {
    return `regenera:user:${userId}`;
  }

  private expectedDetails(
    user: NonNullable<ReturnType<DiditOnboardingRepository['findUserForDidit']>>,
    documentType: RegeneraDocumentType,
  ): Record<string, unknown> {
    const [firstName, ...last] = (user.displayName ?? '').trim().split(/\s+/).filter(Boolean);
    return {
      ...(firstName ? { first_name: firstName } : {}),
      ...(last.length ? { last_name: last.join(' ') } : {}),
      ...(user.birthDate ? { date_of_birth: user.birthDate } : {}),
      id_country: 'BRA',
      expected_document_types: documentType === 'CNH' ? ['DL'] : ['ID'],
    };
  }
}
