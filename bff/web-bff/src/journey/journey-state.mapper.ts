import type { AccountStatus, KycStatus, KycPipelineStep } from '../onboarding/onboarding.types';
import type { AccountOpeningState } from './journey.types';

export const mapOnboardingToJourneyState = (input: {
  kycStatus: KycStatus;
  kycStep: KycPipelineStep;
  accountStatus: AccountStatus;
}): AccountOpeningState => {
  if (input.kycStatus === 'REJECTED') {
    return 'REJECTED';
  }
  if (input.accountStatus === 'ACTIVE') {
    return 'COMPLETED';
  }
  if (input.kycStatus === 'APPROVED' && input.accountStatus === 'NONE') {
    return 'APPROVED';
  }
  switch (input.kycStep) {
    case 'cadastral':
      return input.kycStatus === 'IN_REVIEW'
        ? 'KYC_PROCESSING'
        : 'PERSONAL_DATA_PENDING';
    case 'document':
      return 'DOCUMENTS_PENDING';
    case 'selfie':
      return 'SELFIE_PENDING';
    case 'manual_review':
      return 'MANUAL_REVIEW';
    case 'done':
      return input.kycStatus === 'APPROVED' ? 'APPROVED' : 'KYC_PROCESSING';
    default:
      return 'DRAFT';
  }
};

export const allowedActionsForState = (
  state: AccountOpeningState,
): readonly string[] => {
  switch (state) {
    case 'DRAFT':
    case 'PERSONAL_DATA_PENDING':
      return ['PUT_PERSONAL_DATA', 'SUBMIT_CADASTRAL', 'GET_STATUS'];
    case 'DOCUMENTS_PENDING':
      return ['POST_DOCUMENTS', 'GET_STATUS'];
    case 'SELFIE_PENDING':
    case 'LIVENESS_PENDING':
      return ['POST_SELFIE', 'POST_LIVENESS', 'GET_STATUS'];
    case 'KYC_PROCESSING':
      return ['GET_STATUS'];
    case 'MANUAL_REVIEW':
      return ['GET_STATUS', 'WAIT_DECISION'];
    case 'APPROVED':
      return ['OPEN_ACCOUNT', 'REGISTER_PASSKEY', 'GET_STATUS'];
    case 'ACCOUNT_CREATING':
      return ['GET_STATUS'];
    case 'COMPLETED':
      return ['GET_EXPERIENCE_HOME', 'GET_STATUS'];
    case 'REJECTED':
      return ['RETRY_BIOMETRIC', 'RETRY_CADASTRAL', 'GET_STATUS'];
    case 'CANCELLED':
    case 'EXPIRED':
      return ['GET_STATUS'];
    default:
      return ['GET_STATUS'];
  }
};