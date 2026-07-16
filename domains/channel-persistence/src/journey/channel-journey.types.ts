export type JourneyChannel = 'WEB' | 'ANDROID' | 'IOS' | 'DESKTOP' | 'PWA';

export type JourneyType = 'ACCOUNT_OPENING' | 'PIX_TRANSFER' | 'AUTH';

export type AccountOpeningState =
  | 'DRAFT'
  | 'PERSONAL_DATA_PENDING'
  | 'DOCUMENTS_PENDING'
  | 'SELFIE_PENDING'
  | 'LIVENESS_PENDING'
  | 'KYC_PROCESSING'
  | 'MANUAL_REVIEW'
  | 'APPROVED'
  | 'ACCOUNT_CREATING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

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

export interface OnboardingRecord {
  readonly userId: string;
  kycStatus: KycStatus;
  accountStatus: AccountStatus;
  kycStep: KycPipelineStep;
  kycId?: string;
  kycReason?: string;
  identitySource?: string;
  pepScore?: number;
  /** Metadado PG — blob em object storage, nunca Base64 aqui */
  documentAssetId?: string;
  accountOpenedAt?: string;
  kycSubmittedAt?: string;
  kycApprovedAt?: string;
  diditVendorData?: string;
  diditSessionId?: string;
  diditSessionUrl?: string;
  diditStatus?: string;
  diditDecision?: DiditDecision;
  diditWorkflowId?: string;
  diditWorkflowVersion?: number;
  diditDocumentType?: DiditDocumentType;
  diditDocumentFormat?: DiditDocumentFormat;
  diditLastEventId?: string;
  diditLastSyncedAt?: string;
  diditWebhookTrust?: DiditWebhookTrust;
  diditEvidenceHash?: string;
  diditKycWarnings?: string[];
}

export interface JourneyRecord {
  readonly journeyId: string;
  readonly journeyType: JourneyType;
  readonly userId?: string;
  readonly channel: JourneyChannel;
  readonly deviceId: string;
  readonly locale: string;
  readonly appVersion?: string;
  readonly platformVersion?: string;
  currentState: AccountOpeningState;
  version: number;
  readonly createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface OnboardingTransition {
  readonly id: string;
  readonly journeyId: string;
  readonly previousState: AccountOpeningState;
  readonly newState: AccountOpeningState;
  readonly command: string;
  readonly actor: string;
  readonly channel: JourneyChannel;
  readonly correlationId: string;
  readonly version: number;
  readonly createdAt: string;
}

export interface JourneySnapshot {
  journeys: Record<string, JourneyRecord>;
  journeyActiveByUserId: Record<string, string>;
  onboarding: Record<string, OnboardingRecord>;
  transitions: OnboardingTransition[];
  /** Dedupe idempotente de webhooks Didit (event_id → receivedAt ISO) */
  diditWebhookDedup?: Record<string, string>;
}

export function emptyJourneySnapshot(): JourneySnapshot {
  return {
    journeys: {},
    journeyActiveByUserId: {},
    onboarding: {},
    transitions: [],
  };
}