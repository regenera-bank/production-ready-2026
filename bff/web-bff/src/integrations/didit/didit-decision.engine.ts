/**
 * DiditDecisionEngine — camada ADITIVA sobre o mapper canônico.
 *
 * Fonte única de verdade para coaching/retry/fatal: `didit-error.mapper.ts`
 * (usado pelo fluxo ativo DiditOnboardingService → didit.adapter.buildChannelState
 * → OnboardingService.toStatusResponse). Este módulo NÃO duplica tabelas —
 * delega ao mapper e adiciona apenas o que o canal ainda não recebe pronto:
 *   - uiState/headline (máquina de estados de apresentação);
 *   - rótulos pt-BR para kycReason DIDIT_* específicos;
 *   - rótulos de etapa (step labels) com ajuste CNH.
 *
 * Contratos preservados: vendor_data `regenera:user:<id>` (+ lookup legado),
 * workflow_id do SDK, eventos consumidos por syncDiditKycStatus().
 */
import type { OnboardingRecord } from '../../onboarding/onboarding.types';
import {
  coachingFromSdkEvent,
  flowInstructions,
  type DiditCoachingState,
} from './didit-error.mapper';
import type {
  DiditSessionStatus,
  RegeneraDocumentFormat,
  RegeneraDocumentType,
} from './didit.types';

export type DiditEventPresentation = DiditCoachingState & { code: string | null };

export interface DiditStatusPresentation extends DiditEventPresentation {
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
}

export const DIDIT_STEP_LABELS: Record<string, string> = {
  document_selection: 'Confirme o documento escolhido',
  document_front: 'Envie a frente do documento',
  document_back: 'Envie o verso do documento',
  face: 'Selfie — prova de vida',
  email: 'Confirmação de e-mail',
  phone: 'Confirmação de telefone',
  poa: 'Comprovante de endereço',
  questionnaire: 'Questionário',
};

/** Rótulos pt-BR para kycReason DIDIT_* — complementa DECISION_MESSAGES do mapper. */
export const DIDIT_KYC_REASON_LABELS: Record<string, string> = {
  DIDIT_MANUAL_REVIEW: 'Verificação em análise manual — você será avisado.',
  DIDIT_REJECTED: 'Verificação recusada pelo provedor de identidade.',
  DIDIT_PROVIDER_ERROR: 'Instabilidade no provedor de identidade — tente novamente.',
  DIDIT_LIVENESS_ATTACK: 'Tentativa de fraude detectada — verificação encerrada.',
  DIDIT_LOW_LIVENESS: 'Prova de vida não aceita — refaça a selfie ao vivo.',
  DIDIT_NO_FACE: 'Rosto não detectado — refaça a selfie centralizada.',
  DIDIT_MULTIPLE_FACES: 'Mais de um rosto detectado — refaça a selfie sozinho.',
  DIDIT_BLOCKLIST: 'Verificação encerrada — contate o suporte.',
  DIDIT_DUPLICATE_FACE: 'Rosto já vinculado a outra conta — contate o suporte.',
};

const extractCode = (data?: Record<string, unknown> | null): string | null => {
  if (!data) return null;
  const codes = Array.isArray(data.feedback_codes)
    ? data.feedback_codes.filter((c): c is string => typeof c === 'string')
    : [];
  const error = typeof data.error === 'string' ? [data.error] : [];
  return [...codes, ...error].map((c) => c.toUpperCase())[0] ?? null;
};

/** Delegação direta ao mapper canônico + código para Auditoria. */
export const interpretDiditEventData = (
  data?: Record<string, unknown> | null,
): DiditEventPresentation => ({
  ...coachingFromSdkEvent(data ?? undefined),
  code: extractCode(data),
});

export const diditFlowInstructions = flowInstructions;

export const formatDiditStep = (
  step: string | undefined,
  documentType: RegeneraDocumentType | null,
): string => {
  if (!step) return 'Preparando verificação...';
  if (step === 'document_front' && documentType === 'CNH') {
    return 'CNH — envie o PDF completo da CNH-e ou foto da frente do cartão';
  }
  if (step === 'document_back' && documentType === 'CNH') {
    return 'CNH — um único PDF com frente e verso; não envie arquivos separados';
  }
  return DIDIT_STEP_LABELS[step] ?? step.replace(/_/g, ' ');
};

const uiStateFromStatus = (
  diditStatus: DiditSessionStatus | undefined,
  kycStatus: OnboardingRecord['kycStatus'] | undefined,
): DiditStatusPresentation['uiState'] => {
  if (kycStatus === 'APPROVED' || diditStatus === 'Approved') return 'approved';
  if (diditStatus === 'Declined' || kycStatus === 'REJECTED') return 'rejected';
  if (diditStatus === 'In Review') return 'manual_review';
  if (diditStatus === 'Expired' || diditStatus === 'Kyc Expired' || diditStatus === 'Abandoned') {
    return 'expired';
  }
  if (
    diditStatus === 'In Progress' ||
    diditStatus === 'Awaiting User' ||
    diditStatus === 'Resubmitted' ||
    diditStatus === 'Not Started'
  ) {
    return 'in_progress';
  }
  if (kycStatus === 'IN_REVIEW') return 'processing';
  return 'idle';
};

const HEADLINES: Record<DiditStatusPresentation['uiState'], string> = {
  idle: 'Verificação de identidade',
  in_progress: 'Verificação em andamento',
  processing: 'Processando sua verificação',
  approved: 'Identidade verificada',
  manual_review: 'Verificação em análise manual',
  rejected: 'Verificação recusada',
  expired: 'Sessão expirada — reinicie a verificação',
  error: 'Falha na verificação',
};

/**
 * Presentation agregada (uiState + headline + coaching canônico).
 * Complementa buildChannelState — não o substitui.
 */
export const resolveDiditPresentation = (input: {
  diditStatus?: DiditSessionStatus;
  kycStatus?: OnboardingRecord['kycStatus'];
  kycStep?: string;
  kycReason?: string;
  documentType?: RegeneraDocumentType | null;
  documentFormat?: RegeneraDocumentFormat | null;
  eventData?: Record<string, unknown> | null;
}): DiditStatusPresentation => {
  const event = interpretDiditEventData(input.eventData);
  const uiState = event.fatal
    ? 'rejected'
    : uiStateFromStatus(input.diditStatus, input.kycStatus);
  const reasonLabel = input.kycReason
    ? DIDIT_KYC_REASON_LABELS[input.kycReason]
    : undefined;
  const docType = input.documentType ?? 'RG';
  const docFormat = input.documentFormat ?? 'physical';
  return {
    uiState,
    headline: HEADLINES[uiState],
    stepLabel: formatDiditStep(input.kycStep, input.documentType ?? null),
    instructions:
      uiState === 'in_progress' || uiState === 'idle'
        ? flowInstructions(docType, docFormat)
        : [],
    message: event.message ?? reasonLabel ?? null,
    retryable:
      event.fatal || uiState === 'rejected'
        ? false
        : event.retryable || uiState === 'expired' || uiState === 'error',
    fatal: event.fatal,
    code: event.code ?? input.kycReason ?? null,
  };
};
