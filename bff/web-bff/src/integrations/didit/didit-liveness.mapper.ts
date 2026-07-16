import type { KycStatus, OnboardingRecord } from '../../onboarding/onboarding.types';
import type { DiditSessionStatus } from './didit.types';

export type DiditFaceLivenessMethod = 'PASSIVE' | 'ACTIVE_3D' | 'FLASHING';

export interface DiditLivenessCheck {
  readonly status?: string;
  readonly method?: string;
  readonly score?: number;
  readonly warnings?: readonly string[];
}

export interface DiditKycMapping {
  readonly kycStatus: KycStatus;
  readonly kycStep: OnboardingRecord['kycStep'];
  readonly kycReason?: string;
}

const LIVENESS_WARNING_PRIORITY = [
  'LIVENESS_FACE_ATTACK',
  'FACE_IN_BLOCKLIST',
  'DUPLICATED_FACE',
  'POSSIBLE_FACE_IN_BLOCKLIST',
  'POSSIBLE_DUPLICATED_FACE',
  'LOW_LIVENESS_SCORE',
  'NO_FACE_DETECTED',
  'MULTIPLE_FACES_DETECTED',
] as const;

const WARNING_TO_REASON: Record<string, string> = {
  LIVENESS_FACE_ATTACK: 'DIDIT_LIVENESS_ATTACK',
  LOW_LIVENESS_SCORE: 'DIDIT_LOW_LIVENESS',
  NO_FACE_DETECTED: 'DIDIT_NO_FACE',
  MULTIPLE_FACES_DETECTED: 'DIDIT_MULTIPLE_FACES',
  FACE_IN_BLOCKLIST: 'DIDIT_BLOCKLIST',
  POSSIBLE_FACE_IN_BLOCKLIST: 'DIDIT_BLOCKLIST',
  DUPLICATED_FACE: 'DIDIT_DUPLICATE_FACE',
  POSSIBLE_DUPLICATED_FACE: 'DIDIT_DUPLICATE_FACE',
};

export const resolveDiditLivenessMethod = (): DiditFaceLivenessMethod => {
  const raw = process.env.DIDIT_LIVENESS_METHOD?.trim().toUpperCase();
  if (raw === 'PASSIVE' || raw === 'ACTIVE_3D' || raw === 'FLASHING') {
    return raw;
  }
  return 'ACTIVE_3D';
};

export const extractLivenessChecks = (
  decision?: Record<string, unknown>,
): DiditLivenessCheck[] => {
  if (!decision) {
    return [];
  }
  const checks = decision.liveness_checks;
  if (!Array.isArray(checks)) {
    return [];
  }
  return checks.filter(
    (entry): entry is DiditLivenessCheck =>
      typeof entry === 'object' && entry !== null,
  );
};

export const collectLivenessWarnings = (checks: readonly DiditLivenessCheck[]): string[] => {
  const warnings = new Set<string>();
  for (const check of checks) {
    for (const code of check.warnings ?? []) {
      if (typeof code === 'string' && code.trim()) {
        warnings.add(code.trim().toUpperCase());
      }
    }
  }
  return [...warnings];
};

export const mapLivenessWarningsToReason = (
  warnings: readonly string[],
): string | undefined => {
  const normalized = new Set(warnings.map((code) => code.trim().toUpperCase()));
  for (const code of LIVENESS_WARNING_PRIORITY) {
    if (normalized.has(code)) {
      return WARNING_TO_REASON[code];
    }
  }
  return undefined;
};

export const resolveKycFromDiditSession = (
  status: DiditSessionStatus | undefined,
  decision?: Record<string, unknown>,
): DiditKycMapping => {
  const livenessChecks = extractLivenessChecks(decision);
  const livenessReason = mapLivenessWarningsToReason(
    collectLivenessWarnings(livenessChecks),
  );

  switch (status) {
    case 'Approved':
      return { kycStatus: 'APPROVED', kycStep: 'done' };
    case 'Declined':
      return {
        kycStatus: 'REJECTED',
        kycStep: 'didit_verification',
        kycReason: livenessReason ?? 'DIDIT_DECLINED',
      };
    case 'In Review':
      return {
        kycStatus: 'IN_REVIEW',
        kycStep: 'manual_review',
        kycReason: livenessReason,
      };
    case 'Expired':
    case 'Kyc Expired':
      return {
        kycStatus: 'REJECTED',
        kycStep: 'didit_verification',
        kycReason: 'DIDIT_EXPIRED',
      };
    case 'Abandoned':
      return {
        kycStatus: 'REJECTED',
        kycStep: 'didit_verification',
        kycReason: 'DIDIT_ABANDONED',
      };
    case 'Not Started':
    case 'In Progress':
    case 'Awaiting User':
    case 'Resubmitted':
      return { kycStatus: 'IN_REVIEW', kycStep: 'didit_verification' };
    default:
      return { kycStatus: 'IN_REVIEW', kycStep: 'didit_verification' };
  }
};