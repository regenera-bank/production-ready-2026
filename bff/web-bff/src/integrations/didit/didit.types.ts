export type DiditCallbackMethod = 'initiator' | 'completer' | 'both';

export type RegeneraDocumentType = 'RG' | 'CNH';
export type RegeneraDocumentFormat = 'physical' | 'digital';

export type DiditSessionStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Awaiting User'
  | 'Resubmitted'
  | 'Approved'
  | 'Declined'
  | 'In Review'
  | 'Abandoned'
  | 'Expired'
  | 'Kyc Expired'
  | string;

export type RegeneraKycDecision =
  | 'PROCESSING'
  | 'APPROVED'
  | 'MANUAL_REVIEW'
  | 'REJECTED'
  | 'ABANDONED'
  | 'EXPIRED'
  | 'PROVIDER_ERROR';

export type RegeneraDiditStep =
  | 'document_selection'
  | 'document_front'
  | 'document_back'
  | 'face'
  | 'email'
  | 'phone'
  | 'poa'
  | 'questionnaire'
  | string;

export interface DiditCreateSessionInput {
  vendorData: string;
  callback: string;
  callbackMethod?: DiditCallbackMethod;
  language?: string;
  metadata?: Record<string, unknown>;
  contactEmail?: string;
  contactPhone?: string;
  sendNotificationEmails?: boolean;
  expectedDetails?: Record<string, unknown>;
  documentType?: RegeneraDocumentType;
  documentFormat?: RegeneraDocumentFormat;
  correlationId?: string;
}

export interface DiditCreateSessionResponse {
  session_id: string;
  session_kind?: 'user' | 'business' | string;
  session_number?: number;
  session_token?: string;
  url: string;
  vendor_data?: string;
  metadata?: Record<string, unknown> | null;
  status: DiditSessionStatus;
  workflow_id: string;
  workflow_version?: number;
  callback?: string;
  [key: string]: unknown;
}

export interface DiditRetrieveSessionResponse {
  session_id: string;
  session_kind?: 'user' | 'business' | string;
  status: DiditSessionStatus;
  vendor_data?: string;
  workflow_id?: string;
  workflow_version?: number;
  decision?: Record<string, unknown> | null;
  id_verifications?: Array<Record<string, unknown>> | null;
  nfc_verifications?: Array<Record<string, unknown>> | null;
  liveness_checks?: Array<Record<string, unknown>> | null;
  face_matches?: Array<Record<string, unknown>> | null;
  poa_verifications?: Array<Record<string, unknown>> | null;
  document_ai_documents?: Array<Record<string, unknown>> | null;
  phone_verifications?: Array<Record<string, unknown>> | null;
  email_verifications?: Array<Record<string, unknown>> | null;
  aml_screenings?: Array<Record<string, unknown>> | null;
  ip_analyses?: Array<Record<string, unknown>> | null;
  database_validations?: Array<Record<string, unknown>> | null;
  questionnaire_responses?: Array<Record<string, unknown>> | null;
  metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export type DiditWebhookType =
  | 'status.updated'
  | 'data.updated'
  | 'user.status.updated'
  | 'user.data.updated'
  | 'business.status.updated'
  | 'business.data.updated'
  | 'activity.created'
  | 'transaction.created'
  | 'transaction.status.updated'
  | string;

export type DiditWebhookPayload = DiditWebhookEnvelope;

export interface DiditWebhookEnvelope {
  event_id?: string;
  webhook_type: DiditWebhookType;
  timestamp?: number;
  created_at?: number;
  application_id?: string;
  environment?: 'sandbox' | 'live' | string;
  session_id?: string;
  business_session_id?: string;
  session_kind?: 'user' | 'business' | string;
  status?: DiditSessionStatus;
  previous_status?: DiditSessionStatus;
  vendor_data?: string;
  workflow_id?: string;
  metadata?: Record<string, unknown> | null;
  decision?: Record<string, unknown> | null;
  resubmit_info?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export interface DiditWebhookHeaders {
  timestamp?: string;
  signature?: string;
  signatureV2?: string;
  signatureSimple?: string;
  userAgent?: string;
  isTestWebhook?: boolean;
}

export type DiditWebhookTrust = 'body' | 'raw-body' | 'envelope-only';

export interface VerifiedDiditWebhook {
  payload: DiditWebhookEnvelope;
  trust: DiditWebhookTrust;
  signatureVersion: 'v2' | 'raw' | 'simple';
  eventId: string;
  sessionId?: string;
}

export interface NormalizedDiditKycResult {
  provider: 'DIDIT';
  providerSessionId: string;
  vendorData?: string;
  workflowId?: string;
  workflowVersion?: number;
  rawStatus: DiditSessionStatus;
  decision: RegeneraKycDecision;
  trustedDecision: boolean;
  requiresRefetch: boolean;
  features: {
    document: DiditFeatureStatus;
    nfc: DiditFeatureStatus;
    liveness: DiditFeatureStatus;
    faceMatch: DiditFeatureStatus;
    poa: DiditFeatureStatus;
    aml: DiditFeatureStatus;
    ip: DiditFeatureStatus;
    email: DiditFeatureStatus;
    phone: DiditFeatureStatus;
    database: DiditFeatureStatus;
    questionnaire: DiditFeatureStatus;
  };
  warnings: string[];
  evidence: {
    sessionHash: string;
    decisionHash?: string;
    source: 'webhook' | 'retrieve-session';
    capturedAt: string;
  };
}

export type DiditFeatureStatus =
  | 'PASSED'
  | 'FAILED'
  | 'REVIEW'
  | 'PENDING'
  | 'NOT_RUN'
  | 'UNKNOWN';

export interface DiditFrontendSessionDto {
  provider: 'DIDIT';
  sessionId: string;
  url: string;
  status: DiditSessionStatus;
  statusResponse: unknown;
}
