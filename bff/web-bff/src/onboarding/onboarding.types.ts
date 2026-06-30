export type KycStatus = 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export type KycPipelineStep =
  | 'cadastral'
  | 'document'
  | 'selfie'
  | 'manual_review'
  | 'done';

export type AccountStatus = 'NONE' | 'ACTIVE';

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
  documentPhotoBase64?: string;
  accountOpenedAt?: string;
  kycSubmittedAt?: string;
  kycApprovedAt?: string;
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
}