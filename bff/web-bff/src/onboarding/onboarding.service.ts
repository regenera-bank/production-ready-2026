import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  forwardRef,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { BankingService } from '../banking/banking.service';
import { JourneyService } from '../journey/journey.service';
import { isDiditKycProvider } from '../config/kyc-provider';
import {
  DiditOnboardingService,
  type DiditOnboardingRepository,
} from '../integrations/didit/didit-onboarding.service';
import { buildChannelState } from '../integrations/didit/didit.adapter';
import { resolveDiditPresentation } from '../integrations/didit/didit-decision.engine';
import type {
  NormalizedDiditKycResult,
  RegeneraDocumentFormat,
  RegeneraDocumentType,
} from '../integrations/didit/didit.types';
import { RiskKycOrchestrator } from '../integrations/risk-kyc/risk-kyc.orchestrator';
import {
  ChannelJourneyService,
  DocumentAssetService,
} from '@regenera/channel-persistence';
import type {
  AccountStatus,
  KycPipelineStep,
  KycStatus,
  OnboardingRecord,
  OnboardingStatusResponse,
  ProfileUpdateInput,
} from './onboarding.types';

const homologKycProvider = (): boolean => {
  const provider = process.env.KYC_PROVIDER?.trim().toLowerCase();
  return provider === 'firebase' || provider === 'homolog';
};

const RECOVERABLE_CADASTRAL_REASONS = new Set([
  'IDENTITY_NOT_FOUND',
  'NAME_MISMATCH',
  'INVALID_CEP',
  'ADDRESS_CEP_MISMATCH',
  'DATAVALID_REJECTED',
]);

@Injectable()
export class OnboardingService implements DiditOnboardingRepository {
  constructor(
    private readonly auth: AuthService,
    private readonly riskKyc: RiskKycOrchestrator,
    @Inject(forwardRef(() => DiditOnboardingService))
    private readonly diditOnboarding: DiditOnboardingService,
    private readonly journeyStore: ChannelJourneyService,
    private readonly documentAssets: DocumentAssetService,
    @Inject(forwardRef(() => BankingService))
    private readonly banking: BankingService,
    @Inject(forwardRef(() => JourneyService))
    private readonly journeys: JourneyService,
  ) {}

  initForUser(userId: string): OnboardingRecord {
    const snapshot = this.journeyStore.get();
    const existing = snapshot.onboarding[userId];
    if (existing) {
      return existing;
    }
    const record: OnboardingRecord = {
      userId,
      kycStatus: 'PENDING',
      accountStatus: 'NONE',
      kycStep: isDiditKycProvider() ? 'didit_verification' : 'cadastral',
      ...(isDiditKycProvider() ? { identitySource: 'didit' } : {}),
    };
    this.journeyStore.mutate((draft) => {
      draft.onboarding[userId] = record;
    });
    return record;
  }

  getStatus(userId: string): OnboardingStatusResponse {
    const user = this.auth.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    const record = this.healDiditOnboardingRecord(
      userId,
      this.healHomologKycRecord(
        userId,
        this.healStuckCadastralRecord(userId, this.getRecord(userId)),
      ),
    );
    return this.toStatusResponse(userId, user, record);
  }

  async submitKyc(userId: string): Promise<OnboardingStatusResponse> {
    const user = this.auth.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    let record = this.healStuckCadastralRecord(userId, this.getRecord(userId));
    if (record.kycStatus === 'APPROVED') {
      return this.getStatus(userId);
    }
    if (record.kycStatus === 'REJECTED') {
      if (this.canRetryCadastral(record)) {
        record = this.resetCadastralForRetry(userId, record);
      } else {
        throw new ForbiddenException(
          record.kycReason ?? 'Cadastro rejeitado — contate o suporte',
        );
      }
    }

    this.assertCadastralIntegrationsReady();

    if (isDiditKycProvider()) {
      record.kycSubmittedAt = new Date().toISOString();
      record.kycStep = 'didit_verification';
      record.kycStatus = 'IN_REVIEW';
      record.identitySource = 'didit';
      record.kycReason = undefined;
      this.persistRecord(userId, record);
      return this.getStatus(userId);
    }

    if (!AuthService.isProfileComplete(user)) {
      throw new BadRequestException(
        'Complete CPF, telefone, data de nascimento e endereço antes da verificação cadastral',
      );
    }

    const result = await this.riskKyc.runCadastralStep({
      document: user.document,
      displayName: user.displayName,
      email: user.email,
      phone: user.phone,
      birthDate: user.birthDate ?? '',
      address: user.address,
    });

    record.kycSubmittedAt = new Date().toISOString();
    record.kycId = result.kycId || record.kycId;
    record.kycStep = result.kycStep;
    record.kycReason = result.reason;
    record.identitySource = result.identitySource;
    record.pepScore = result.pepScore;

    if (result.kycStatus === 'REJECTED') {
      record.kycStatus = 'REJECTED';
    } else if (result.kycStep === 'manual_review') {
      record.kycStatus = 'IN_REVIEW';
    } else {
      record.kycStatus = 'IN_REVIEW';
      record.kycStep = result.kycStep;
    }

    this.persistRecord(userId, record);
    return this.getStatus(userId);
  }

  async submitDocument(
    userId: string,
    documentContent: string,
    type: 'RG' | 'CNH',
  ): Promise<OnboardingStatusResponse> {
    const record = this.getRecord(userId);
    if (record.kycStep !== 'document') {
      throw new BadRequestException(
        'Envie o documento somente após a etapa cadastral',
      );
    }
    if (!documentContent?.trim()) {
      throw new BadRequestException('Imagem do documento obrigatória');
    }

    const result = await this.riskKyc.runDocumentStep(documentContent, type);
    const asset = await this.documentAssets.registerAsync(
      userId,
      documentContent,
      'image/jpeg',
      undefined,
      type,
    );
    record.documentAssetId = asset.id;
    record.kycStep = result.kycStep;
    record.kycReason = result.reason;

    if (result.kycStatus === 'REJECTED') {
      record.kycStatus = 'REJECTED';
    } else {
      record.kycStatus = 'IN_REVIEW';
    }

    this.persistRecord(userId, record);
    return this.getStatus(userId);
  }

  async createDiditSession(
    userId: string,
    options?: {
      documentType?: 'RG' | 'CNH';
      documentFormat?: 'physical' | 'digital';
      forceNew?: boolean;
    },
  ) {
    if (!isDiditKycProvider()) {
      throw new BadRequestException('KYC Didit não está ativo (KYC_PROVIDER≠didit)');
    }
    const documentType = options?.documentType;
    if (!documentType) {
      throw new BadRequestException(
        'Escolha RG ou CNH antes de iniciar a verificação Didit',
      );
    }

    const user = this.auth.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const record = this.getRecord(userId);
    const terminalDecisions = new Set(['APPROVED', 'REJECTED', 'ABANDONED', 'EXPIRED']);
    const canResume =
      !options?.forceNew &&
      record.kycStep === 'didit_verification' &&
      Boolean(record.diditSessionId) &&
      Boolean(record.diditSessionUrl) &&
      (!record.diditDecision || !terminalDecisions.has(record.diditDecision));

    if (canResume) {
      return {
        provider: 'DIDIT' as const,
        sessionId: record.diditSessionId!,
        url: record.diditSessionUrl!,
        status: record.diditStatus ?? 'In Progress',
        statusResponse: this.toStatusResponse(userId, user, record),
      };
    }

    const callback =
      process.env.DIDIT_SESSION_CALLBACK_URL?.trim() ||
      `${process.env.WEB_ORIGIN?.trim() || 'http://localhost:5176'}/?didit=callback`;

    return this.diditOnboarding.createSession({
      userId,
      callback,
      documentType,
      documentFormat: options?.documentFormat ?? 'physical',
      language: 'pt-BR',
    });
  }

  async syncDiditKyc(userId: string): Promise<OnboardingStatusResponse> {
    if (!isDiditKycProvider()) {
      throw new BadRequestException('KYC Didit não está ativo');
    }
    return (await this.diditOnboarding.syncStatus(userId)) as OnboardingStatusResponse;
  }

  findUserForDidit(userId: string): {
    userId: string;
    document?: string;
    displayName?: string;
    email?: string;
    phone?: string;
    birthDate?: string;
  } | null {
    const user = this.auth.findUserById(userId);
    if (!user) {
      return null;
    }
    return {
      userId,
      document: user.document,
      displayName: user.displayName,
      email: user.email,
      phone: user.phone,
      birthDate: user.birthDate,
    };
  }

  findUserIdByDiditVendorData(vendorData: string): string | null {
    const trimmed = vendorData.trim();
    if (!trimmed) {
      return null;
    }

    const snapshot = this.journeyStore.get();
    const found = Object.entries(snapshot.onboarding).find(
      ([, record]) => record.diditVendorData === trimmed,
    );
    if (found) {
      return found[0];
    }

    const regeneraPrefix = 'regenera:user:';
    if (trimmed.startsWith(regeneraPrefix)) {
      const userId = trimmed.slice(regeneraPrefix.length).trim();
      if (userId && this.auth.findUserById(userId)) {
        return userId;
      }
    }

    const legacyMarker = trimmed.indexOf('::');
    if (legacyMarker >= 0) {
      const userId = trimmed.slice(0, legacyMarker).trim();
      if (userId && this.auth.findUserById(userId)) {
        return userId;
      }
    }

    if (this.auth.findUserById(trimmed)) {
      return trimmed;
    }

    return null;
  }

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
  }): OnboardingStatusResponse {
    const user = this.auth.findUserById(input.userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    const record = this.getRecord(input.userId);
    record.kycStatus = 'IN_REVIEW';
    record.kycStep = 'didit_verification';
    record.identitySource = 'didit';
    record.kycSubmittedAt = record.kycSubmittedAt ?? new Date().toISOString();
    record.diditVendorData = input.vendorData;
    record.diditSessionId = input.sessionId;
    record.diditSessionUrl = input.url;
    record.diditStatus = input.status;
    record.diditDecision = 'PROCESSING';
    record.diditWorkflowId = input.workflowId;
    record.diditWorkflowVersion = input.workflowVersion;
    record.diditDocumentType = input.documentType;
    record.diditDocumentFormat = input.documentFormat;
    record.diditLastSyncedAt = new Date().toISOString();
    this.persistRecord(input.userId, record);
    return this.toStatusResponse(input.userId, user, record);
  }

  applyDiditResult(input: {
    userId: string;
    eventId: string;
    result: NormalizedDiditKycResult;
  }): OnboardingStatusResponse {
    const user = this.auth.findUserById(input.userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    const record = this.getRecord(input.userId);

    if (record.diditLastEventId === input.eventId) {
      return this.toStatusResponse(input.userId, user, record);
    }

    record.diditLastEventId = input.eventId;
    record.diditSessionId = input.result.providerSessionId || record.diditSessionId;
    record.diditStatus = input.result.rawStatus;
    record.diditDecision = input.result.decision;
    record.diditWorkflowId = input.result.workflowId ?? record.diditWorkflowId;
    record.diditWorkflowVersion =
      input.result.workflowVersion ?? record.diditWorkflowVersion;
    record.diditWebhookTrust = input.result.trustedDecision
      ? 'body'
      : 'envelope-only';
    record.diditEvidenceHash = input.result.evidence.sessionHash;
    record.diditKycWarnings = input.result.warnings;
    record.diditLastSyncedAt = new Date().toISOString();
    record.identitySource = 'didit';
    record.kycId = input.result.providerSessionId || record.kycId;

    if (input.result.decision === 'APPROVED') {
      record.kycStatus = 'APPROVED';
      record.kycStep = 'done';
      record.kycApprovedAt = record.kycApprovedAt ?? new Date().toISOString();
      record.kycReason = undefined;
    } else if (input.result.decision === 'MANUAL_REVIEW') {
      record.kycStatus = 'IN_REVIEW';
      record.kycStep = 'didit_verification';
      record.kycReason = 'DIDIT_MANUAL_REVIEW';
    } else if (input.result.decision === 'PROCESSING') {
      record.kycStatus = 'IN_REVIEW';
      record.kycStep = 'didit_verification';
      record.kycReason = undefined;
    } else if (input.result.decision === 'REJECTED') {
      record.kycStatus = 'REJECTED';
      record.kycStep = 'didit_verification';
      record.kycReason = 'DIDIT_REJECTED';
    } else if (
      input.result.decision === 'ABANDONED' ||
      input.result.decision === 'EXPIRED'
    ) {
      record.kycStatus = 'PENDING';
      record.kycStep = 'didit_verification';
      record.kycReason = `DIDIT_${input.result.decision}`;
      record.diditSessionId = undefined;
      record.diditSessionUrl = undefined;
      record.diditStatus = undefined;
      record.diditDecision = undefined;
    } else {
      record.kycStatus = 'IN_REVIEW';
      record.kycStep = 'didit_verification';
      record.kycReason = 'DIDIT_PROVIDER_ERROR';
    }

    this.persistRecord(input.userId, record);
    return this.toStatusResponse(input.userId, user, record);
  }

  async submitSelfie(
    userId: string,
    selfieContent: string,
  ): Promise<OnboardingStatusResponse> {
    const record = this.getRecord(userId);
    if (record.kycStep !== 'selfie') {
      throw new BadRequestException(
        'Selfie somente após validação do documento',
      );
    }
    if (!record.documentAssetId) {
      throw new BadRequestException('Foto do documento ausente na sessão KYC');
    }
    const documentContent = await this.documentAssets.getContentAsync(
      record.documentAssetId,
    );
    if (!documentContent) {
      throw new BadRequestException('Asset de documento expirado ou inválido');
    }
    if (!selfieContent?.trim()) {
      throw new BadRequestException('Selfie obrigatória');
    }

    const result = await this.riskKyc.runSelfieStep(
      selfieContent,
      documentContent,
    );
    record.kycStep = result.kycStep;
    record.kycReason = result.reason;

    if (result.kycStatus === 'APPROVED') {
      record.kycStatus = 'APPROVED';
      record.kycApprovedAt = new Date().toISOString();
    } else {
      record.kycStatus = 'REJECTED';
    }

    this.persistRecord(userId, record);
    return this.getStatus(userId);
  }

  updateProfile(
    userId: string,
    input: ProfileUpdateInput,
  ): OnboardingStatusResponse {
    const user = this.auth.updateUserProfile(userId, {
      document: input.document,
      displayName: input.displayName,
      email: input.email,
      phone: input.phone,
      birthDate: input.birthDate,
      address: input.address,
    });
    this.initForUser(userId);
    this.banking.syncPixDisplayName(userId, user.displayName);
    const record = this.getRecord(userId);
    return this.toStatusResponse(userId, user, record);
  }

  resetCadastralKyc(userId: string): OnboardingStatusResponse {
    const user = this.auth.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    const record = this.getRecord(userId);
    if (record.kycStatus === 'APPROVED') {
      throw new BadRequestException('KYC já aprovado — abra a conta');
    }
    if (
      record.kycStatus === 'REJECTED' &&
      record.kycStep === 'cadastral' &&
      !this.canRetryCadastral(record)
    ) {
      throw new ForbiddenException(
        record.kycReason ?? 'Rejeição definitiva — contate o suporte',
      );
    }
    const healed = this.resetCadastralForRetry(userId, record);
    return this.toStatusResponse(userId, user, healed);
  }

  resetDiditKyc(userId: string): OnboardingStatusResponse {
    if (!isDiditKycProvider()) {
      throw new ForbiddenException(
        'Reenvio Didit disponível apenas com KYC_PROVIDER=didit',
      );
    }
    const user = this.auth.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    const record = this.getRecord(userId);
    if (record.kycStatus === 'APPROVED') {
      throw new BadRequestException('KYC já aprovado — abra a conta');
    }
    if (record.kycStep !== 'didit_verification') {
      throw new BadRequestException(
        'Reenvio Didit só na etapa de verificação de identidade',
      );
    }
    const healed: OnboardingRecord = {
      ...record,
      kycStatus: 'PENDING',
      kycStep: 'didit_verification',
      kycReason: undefined,
      diditSessionId: undefined,
      diditSessionUrl: undefined,
      diditStatus: undefined,
      diditDecision: undefined,
      diditLastEventId: undefined,
      diditLastSyncedAt: undefined,
      diditWebhookTrust: undefined,
      diditEvidenceHash: undefined,
      diditKycWarnings: undefined,
    };
    this.persistRecord(userId, healed);
    return this.toStatusResponse(userId, user, healed);
  }

  resetBiometricKyc(userId: string): OnboardingStatusResponse {
    if (!homologKycProvider()) {
      throw new ForbiddenException(
        'Reenvio de documento/selfie disponível apenas em homolog',
      );
    }
    const user = this.auth.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    const record = this.getRecord(userId);
    if (record.kycStatus === 'APPROVED') {
      throw new BadRequestException('KYC já aprovado — abra a conta');
    }
    const biometricStep =
      record.kycStep === 'document' || record.kycStep === 'selfie';
    if (!biometricStep) {
      throw new BadRequestException(
        'Reenvio biométrico só após etapa de documento ou selfie',
      );
    }
    const healed: OnboardingRecord = {
      ...record,
      kycStatus: 'IN_REVIEW',
      kycStep: 'document',
      kycReason: undefined,
      documentAssetId: undefined,
    };
    this.persistRecord(userId, healed);
    return this.toStatusResponse(userId, user, healed);
  }

  markAccountActive(userId: string): void {
    const record = this.getRecord(userId);
    if (record.kycStatus !== 'APPROVED') {
      throw new ForbiddenException('KYC deve estar aprovado antes da abertura');
    }
    if (record.accountStatus === 'ACTIVE') {
      return;
    }
    record.accountStatus = 'ACTIVE';
    record.accountOpenedAt = new Date().toISOString();
    record.kycStep = 'done';
    this.persistRecord(userId, record);
  }

  /** Maker-checker baseline — persiste via ChannelJourney (postgres ou memória de teste). */
  approveByBaselineOperator(
    userId: string,
    checkerId: string,
  ): { ok: true; checkerId: string } {
    const record = this.getRecord(userId);
    if (record.kycStatus !== 'IN_REVIEW') {
      throw new ConflictException('KYC não está em revisão');
    }
    const healed: OnboardingRecord = {
      ...record,
      kycStatus: 'APPROVED',
      kycStep: 'done',
      kycApprovedAt: new Date().toISOString(),
      kycReason: `BASELINE_CHECKER:${checkerId}`,
    };
    this.persistRecord(userId, healed);
    return { ok: true, checkerId };
  }

  requireKycApproved(userId: string): void {
    const record = this.getRecord(userId);
    if (record.kycStatus !== 'APPROVED') {
      throw new ForbiddenException('Conclua a verificação cadastral (KYC) primeiro');
    }
  }

  requireActiveAccount(userId: string): void {
    const record = this.getRecord(userId);
    if (record.accountStatus !== 'ACTIVE') {
      throw new ForbiddenException('Abra sua conta antes de operar');
    }
  }

  isAccountActive(userId: string): boolean {
    return this.getRecord(userId).accountStatus === 'ACTIVE';
  }

  getKycStatus(userId: string): KycStatus {
    return this.getRecord(userId).kycStatus;
  }

  getAccountStatus(userId: string): AccountStatus {
    return this.getRecord(userId).accountStatus;
  }

  listActiveUserIds(): string[] {
    return Object.entries(this.journeyStore.get().onboarding)
      .filter(([, record]) => record.accountStatus === 'ACTIVE')
      .map(([userId]) => userId);
  }

  private canRetryCadastral(record: OnboardingRecord): boolean {
    if (record.kycStatus !== 'REJECTED') {
      return false;
    }
    if (record.kycStep !== 'cadastral') {
      return false;
    }
    if (!record.kycReason) {
      return true;
    }
    return RECOVERABLE_CADASTRAL_REASONS.has(record.kycReason);
  }

  private resetCadastralForRetry(
    userId: string,
    record: OnboardingRecord,
  ): OnboardingRecord {
    const healed: OnboardingRecord = {
      ...record,
      kycStatus: 'PENDING',
      kycStep: 'cadastral',
      kycReason: undefined,
      kycSubmittedAt: undefined,
      documentAssetId: undefined,
    };
    this.persistRecord(userId, healed);
    return healed;
  }

  private healHomologKycRecord(
    userId: string,
    record: OnboardingRecord,
  ): OnboardingRecord {
    if (!homologKycProvider()) {
      return record;
    }
    if (
      record.kycStatus === 'APPROVED' &&
      record.kycStep === 'done' &&
      record.documentAssetId
    ) {
      return record;
    }
    if (
      record.kycStatus === 'APPROVED' &&
      !record.documentAssetId
    ) {
      if (record.accountStatus === 'ACTIVE' || record.accountOpenedAt) {
        return record;
      }
      const healed: OnboardingRecord = {
        ...record,
        kycStatus: 'IN_REVIEW',
        kycStep: 'document',
        kycReason: 'KYC_LEGACY_RESET',
      };
      this.persistRecord(userId, healed);
      return healed;
    }
    return record;
  }

  private healDiditOnboardingRecord(
    userId: string,
    record: OnboardingRecord,
  ): OnboardingRecord {
    if (!isDiditKycProvider()) {
      return record;
    }
    if (record.kycStatus === 'APPROVED' || record.accountStatus === 'ACTIVE') {
      return record;
    }
    const legacySteps: KycPipelineStep[] = ['cadastral', 'document', 'selfie'];
    if (!legacySteps.includes(record.kycStep)) {
      return record;
    }
    const healed: OnboardingRecord = {
      ...record,
      kycStep: 'didit_verification',
      identitySource: 'didit',
      kycReason: undefined,
    };
    this.persistRecord(userId, healed);
    return healed;
  }

  private healStuckCadastralRecord(
    userId: string,
    record: OnboardingRecord,
  ): OnboardingRecord {
    if (isDiditKycProvider()) {
      return record;
    }
    if (record.kycStatus !== 'IN_REVIEW' || record.kycStep !== 'cadastral') {
      return record;
    }
    const healed: OnboardingRecord = {
      ...record,
      kycStatus: 'PENDING',
      kycSubmittedAt: undefined,
    };
    this.persistRecord(userId, healed);
    return healed;
  }

  private assertCadastralIntegrationsReady(): void {
    const provider = process.env.KYC_PROVIDER?.trim().toLowerCase();
    if (provider === 'firebase' || provider === 'homolog') {
      return;
    }
    if (provider === 'didit') {
      if (!process.env.DIDIT_API_KEY?.trim()) {
        throw new ServiceUnavailableException(
          'DIDIT_API_KEY ausente — configure bff/web-bff/.env e reinicie o BFF.',
        );
      }
      return;
    }
    const prometeo = Boolean(process.env.PROMETEO_API_KEY?.trim());
    const pepDedicated =
      Boolean(process.env.PEP_API_URL?.trim()) &&
      Boolean(process.env.PEP_API_KEY?.trim());
    const datavalidDedicated =
      Boolean(process.env.DATAVALID_API_URL?.trim()) &&
      Boolean(process.env.DATAVALID_API_KEY?.trim());

    const missing: string[] = [];
    if (!prometeo) {
      missing.push('PROMETEO_API_KEY');
    }
    if (!pepDedicated && !prometeo) {
      missing.push('PEP_API_URL + PEP_API_KEY (ou Prometeo)');
    }
    if (!datavalidDedicated && !prometeo) {
      missing.push('DATAVALID_API_URL + DATAVALID_API_KEY (ou Prometeo)');
    }
    if (missing.length > 0) {
      throw new ServiceUnavailableException(
        `Integrações KYC cadastral ausentes no BFF: ${missing.join(', ')}. Configure bff/web-bff/.env e reinicie npm run dev:canal-web.`,
      );
    }
  }

  private getRecord(userId: string): OnboardingRecord {
    const snapshot = this.journeyStore.get();
    return snapshot.onboarding[userId] ?? this.initForUser(userId);
  }

  private persistRecord(userId: string, record: OnboardingRecord): void {
    this.journeyStore.mutate((draft) => {
      draft.onboarding[userId] = record;
    });
    this.journeys.bumpVersionForUser(userId);
  }

  private toStatusResponse(
    userId: string,
    user: NonNullable<ReturnType<AuthService['findUserById']>>,
    record: OnboardingRecord,
  ): OnboardingStatusResponse {
    return {
      userId,
      displayName: user.displayName,
      document: user.document,
      email: user.email,
      phone: user.phone,
      birthDate: user.birthDate,
      profileComplete: AuthService.isProfileComplete(user),
      address: user.address,
      kycStatus: record.kycStatus,
      accountStatus: record.accountStatus,
      kycStep: record.kycStep,
      kycReason: record.kycReason,
      identitySource: record.identitySource,
      pepScore: record.pepScore,
      accountOpenedAt: record.accountOpenedAt,
      diditSessionId: record.diditSessionId,
      diditSessionUrl: record.diditSessionUrl,
      diditStatus: record.diditStatus,
      diditDecision: record.diditDecision,
      diditDocumentType: record.diditDocumentType,
      diditDocumentFormat: record.diditDocumentFormat,
      diditLastSyncedAt: record.diditLastSyncedAt,
      diditWebhookTrust: record.diditWebhookTrust,
      diditKycWarnings: record.diditKycWarnings,
      ...buildChannelState({
        diditSessionId: record.diditSessionId,
        diditStatus: record.diditStatus,
        diditDecision: record.diditDecision,
        diditWebhookTrust: record.diditWebhookTrust,
        diditLastSyncedAt: record.diditLastSyncedAt,
        diditKycWarnings: record.diditKycWarnings,
        diditDocumentType: record.diditDocumentType,
        diditDocumentFormat: record.diditDocumentFormat,
        kycStatus: record.kycStatus,
        kycStep: record.kycStep,
        kycReason: record.kycReason,
      }),
      diditPresentation: resolveDiditPresentation({
        diditStatus: record.diditStatus,
        kycStatus: record.kycStatus,
        kycStep: record.kycStep,
        kycReason: record.kycReason,
        documentType: record.diditDocumentType ?? null,
        documentFormat: record.diditDocumentFormat ?? null,
      }),
      kycProvider: process.env.KYC_PROVIDER?.trim().toLowerCase(),
    };
  }
}