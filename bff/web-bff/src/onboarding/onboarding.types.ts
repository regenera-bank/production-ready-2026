export type KycStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export type KycPipelineStep =
  | 'cadastral'
  | 'document'
  | 'selfie'
  | 'didit_verification'
  | 'manual_review'
  | 'done';

export type AccountStatus = 'NONE' | 'ACTIVE';

export type DiditDocumentType = 'RG' | 'CNH';
export type DiditDocumentFormat = 'physical' | 'digital';
export type DiditDecision =
  | 'PROCESSING'
  | 'APPROVED'
  | 'MANUAL_REVIEW'
  | 'REJECTED'
  | 'ABANDONED'
  | 'EXPIRED'
  | 'PROVIDER_ERROR';
export type DiditWebhookTrust = 'body' | 'raw-body' | 'envelope-only';

export interface AddressRecord {
  readonly street: string;
  readonly number: string;
  readonly complement?: string;
  readonly neighborhood: string;
  readonly city: string;
  readonly state: string;
  readonly postalCode: string;
}

export interface OnboardingRecord {
  readonly userId: string;
  kycStatus: KycStatus;
  accountStatus: AccountStatus;
  kycStep: KycPipelineStep;
  kycId?: string;
  kycReason?: string;
  identitySource?: string;
  pepScore?: number;
  /** Referência object storage — sem Base64 no registro de onboarding */
  documentAssetId?: string;
  accountOpenedAt?: string;
  kycSubmittedAt?: string;
  kycApprovedAt?: string;
  /** Sessão Didit (KYC_PROVIDER=didit) */
  diditVendorData?: string;
  diditSessionId?: string;
  diditSessionUrl?: string;
  diditStatus?: string;
  diditDecision?: DiditDecision;
  diditWorkflowId?: string;
  diditWorkflowVersion?: number;
  /** RG ou CNH escolhido antes de abrir o iframe Didit */
  diditDocumentType?: DiditDocumentType;
  diditDocumentFormat?: DiditDocumentFormat;
  diditLastEventId?: string;
  diditLastSyncedAt?: string;
  diditWebhookTrust?: DiditWebhookTrust;
  diditEvidenceHash?: string;
  diditKycWarnings?: string[];
}

export interface ProfileUpdateInput {
  readonly document: string;
  readonly displayName: string;
  readonly email: string;
  readonly phone: string;
  readonly birthDate: string;
  readonly address: AddressRecord;
}

export interface OnboardingStatusResponse {
  readonly userId: string;
  readonly displayName: string;
  readonly document: string;
  readonly email: string;
  readonly phone: string;
  readonly birthDate?: string;
  readonly profileComplete: boolean;
  readonly address: AddressRecord;
  readonly kycStatus: KycStatus;
  readonly accountStatus: AccountStatus;
  readonly kycStep: KycPipelineStep;
  readonly kycReason?: string;
  readonly identitySource?: string;
  readonly pepScore?: number;
  readonly accountOpenedAt?: string;
  readonly diditSessionId?: string;
  readonly diditSessionUrl?: string;
  readonly diditStatus?: string;
  readonly diditDecision?: DiditDecision;
  readonly diditDocumentType?: DiditDocumentType;
  readonly diditDocumentFormat?: DiditDocumentFormat;
  readonly diditLastSyncedAt?: string;
  readonly diditWebhookTrust?: DiditWebhookTrust;
  readonly diditKycWarnings?: string[];
  readonly diditCoachingMessage?: string | null;
  readonly diditRetryable?: boolean;
  readonly diditFatal?: boolean;
  readonly diditFlowInstructions?: string[];
  /** Presentation agregada (uiState/headline) — didit-decision.engine, aditivo. */
  readonly diditPresentation?: {
    uiState:
      | 'idle'
      | 'in_progress'
      | 'processing'
      | 'approved'
      | 'manual_review'
      | 'rejected'
      | 'expired'
      | 'error';
    headline: string;
    stepLabel: string;
    instructions: string[];
    message: string | null;
    retryable: boolean;
    fatal: boolean;
    code: string | null;
  };
  readonly kycProvider?: string;
}