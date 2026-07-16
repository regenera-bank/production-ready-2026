/**
 * Ponte única SDK ↔ webhook ↔ BFF ↔ canal.
 * DiditOnboardingService orquestra; este módulo define o contrato e o estado exposto ao React.
 */
import type { NormalizedDiditKycResult } from './didit.types';
import {
  coachingFromBffRecord,
  flowInstructions,
  type DiditCoachingState,
} from './didit-error.mapper';

export type DiditChannelPhase =
  | 'pick'
  | 'starting'
  | 'live'
  | 'review'
  | 'approved'
  | 'error';

export interface DiditSdkBridgeContract {
  /** POST /onboarding/kyc/didit/session */
  createSession: {
    documentType: 'RG' | 'CNH';
    documentFormat?: 'physical' | 'digital';
  };
  /** Resposta — url vai para DiditSdk.startVerification({ embedded: true }) */
  sessionResponse: {
    provider: 'DIDIT';
    sessionId: string;
    url: string;
    status: string;
    statusResponse: DiditChannelState;
  };
  /** POST /onboarding/kyc/didit/sync — após webhook ou poll SDK */
  sync: { returns: DiditChannelState };
  /** Eventos SDK (canal) — coaching local até próximo sync */
  sdkEvents: (
    | 'didit:ready'
    | 'didit:started'
    | 'didit:step_changed'
    | 'didit:status_updated'
    | 'didit:verification_submitted'
    | 'didit:completed'
    | 'didit:error'
  )[];
}

export interface DiditChannelState {
  diditSessionId?: string;
  diditSessionUrl?: string;
  diditStatus?: string;
  diditDecision?: string;
  diditWebhookTrust?: string;
  diditLastSyncedAt?: string;
  diditCoachingMessage?: string | null;
  diditRetryable?: boolean;
  diditFatal?: boolean;
  diditFlowInstructions?: string[];
  kycStatus: string;
  kycStep: string;
}

export function buildChannelState(record: {
  diditSessionId?: string;
  diditStatus?: string;
  diditDecision?: NormalizedDiditKycResult['decision'];
  diditWebhookTrust?: string;
  diditLastSyncedAt?: string;
  diditKycWarnings?: string[];
  diditDocumentType?: 'RG' | 'CNH';
  diditDocumentFormat?: 'physical' | 'digital';
  kycStatus: string;
  kycStep: string;
  kycReason?: string;
}): Pick<
  DiditChannelState,
  'diditCoachingMessage' | 'diditRetryable' | 'diditFatal' | 'diditFlowInstructions'
> {
  const coaching: DiditCoachingState = coachingFromBffRecord({
    diditDecision: record.diditDecision,
    diditKycWarnings: record.diditKycWarnings,
    kycReason: record.kycReason,
    diditDocumentType: record.diditDocumentType,
  });
  const diditFlowInstructions =
    record.diditDocumentType != null
      ? flowInstructions(
          record.diditDocumentType,
          record.diditDocumentFormat ?? 'physical',
        )
      : undefined;
  return {
    diditCoachingMessage: coaching.message,
    diditRetryable: coaching.retryable,
    diditFatal: coaching.fatal,
    diditFlowInstructions,
  };
}

export function resolveChannelPhase(state: {
  kycStatus: string;
  diditSessionId?: string;
  diditSessionUrl?: string;
  diditDecision?: string;
}): DiditChannelPhase {
  if (state.kycStatus === 'APPROVED') return 'approved';
  if (state.diditDecision === 'MANUAL_REVIEW') return 'review';
  if (
    state.diditSessionId &&
    state.diditSessionUrl &&
    state.kycStatus === 'IN_REVIEW' &&
    (!state.diditDecision || state.diditDecision === 'PROCESSING')
  ) {
    return 'live';
  }
  if (state.diditSessionId && state.kycStatus === 'IN_REVIEW') return 'review';
  return 'pick';
}