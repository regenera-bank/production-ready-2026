import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  forwardRef,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { BankingService } from '../banking/banking.service';
import { RiskKycOrchestrator } from '../integrations/risk-kyc/risk-kyc.orchestrator';
import { HomologStoreService } from '../persistence/homolog-store.service';
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
export class OnboardingService {
  constructor(
    private readonly auth: AuthService,
    private readonly riskKyc: RiskKycOrchestrator,
    private readonly store: HomologStoreService,
    @Inject(forwardRef(() => BankingService))
    private readonly banking: BankingService,
  ) {}

  initForUser(userId: string): OnboardingRecord {
    const snapshot = this.store.get();
    const existing = snapshot.onboarding[userId];
    if (existing) {
      return existing;
    }
    const record: OnboardingRecord = {
      userId,
      kycStatus: 'PENDING',
      accountStatus: 'NONE',
      kycStep: 'cadastral',
    };
    this.store.mutate((draft) => {
      draft.onboarding[userId] = record;
    });
    return record;
  }

  getStatus(userId: string): OnboardingStatusResponse {
    const user = this.auth.findUserById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    const record = this.healHomologKycRecord(
      userId,
      this.healStuckCadastralRecord(userId, this.getRecord(userId)),
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
    fileBase64: string,
    type: 'RG' | 'CNH',
  ): Promise<OnboardingStatusResponse> {
    const record = this.getRecord(userId);
    if (record.kycStep !== 'document') {
      throw new BadRequestException(
        'Envie o documento somente após a etapa cadastral',
      );
    }
    if (!fileBase64?.trim()) {
      throw new BadRequestException('Imagem do documento obrigatória');
    }

    const result = await this.riskKyc.runDocumentStep(fileBase64, type);
    record.documentPhotoBase64 = fileBase64;
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

  async submitSelfie(
    userId: string,
    selfieBase64: string,
  ): Promise<OnboardingStatusResponse> {
    const record = this.getRecord(userId);
    if (record.kycStep !== 'selfie') {
      throw new BadRequestException(
        'Selfie somente após validação do documento',
      );
    }
    if (!record.documentPhotoBase64) {
      throw new BadRequestException('Foto do documento ausente na sessão KYC');
    }
    if (!selfieBase64?.trim()) {
      throw new BadRequestException('Selfie obrigatória');
    }

    const result = await this.riskKyc.runSelfieStep(
      selfieBase64,
      record.documentPhotoBase64,
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
    return Object.entries(this.store.get().onboarding)
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
      documentPhotoBase64: undefined,
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
      record.documentPhotoBase64
    ) {
      return record;
    }
    if (
      record.kycStatus === 'APPROVED' &&
      !record.documentPhotoBase64
    ) {
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

  private healStuckCadastralRecord(
    userId: string,
    record: OnboardingRecord,
  ): OnboardingRecord {
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
    const snapshot = this.store.get();
    return snapshot.onboarding[userId] ?? this.initForUser(userId);
  }

  private persistRecord(userId: string, record: OnboardingRecord): void {
    this.store.mutate((draft) => {
      draft.onboarding[userId] = record;
    });
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
    };
  }
}