import { createHash } from 'node:crypto';
import type {
  DiditFeatureStatus,
  DiditRetrieveSessionResponse,
  DiditWebhookEnvelope,
  DiditWebhookTrust,
  DiditSessionStatus,
  NormalizedDiditKycResult,
  RegeneraKycDecision,
} from './didit.types';
import { diditCanonicalJson } from './didit-canonical-json';

export class DiditNormalizer {
  fromRetrieveSession(report: DiditRetrieveSessionResponse): NormalizedDiditKycResult {
    const providerSessionId = report.session_id;
    const rawStatus = report.status;
    const decision = this.mapStatus(rawStatus);

    return {
      provider: 'DIDIT',
      providerSessionId,
      vendorData: report.vendor_data,
      workflowId: report.workflow_id,
      workflowVersion: report.workflow_version,
      rawStatus,
      decision,
      trustedDecision: true,
      requiresRefetch: false,
      features: {
        document: this.aggregate(report.id_verifications),
        nfc: this.aggregate(report.nfc_verifications),
        liveness: this.aggregate(report.liveness_checks),
        faceMatch: this.aggregate(report.face_matches),
        poa: this.aggregate(report.poa_verifications),
        aml: this.aggregate(report.aml_screenings, true),
        ip: this.aggregate(report.ip_analyses),
        email: this.aggregate(report.email_verifications),
        phone: this.aggregate(report.phone_verifications),
        database: this.aggregate(report.database_validations),
        questionnaire: this.aggregate(report.questionnaire_responses),
      },
      warnings: this.collectWarnings(report),
      evidence: {
        sessionHash: this.sha256(report),
        decisionHash: report.decision ? this.sha256(report.decision) : undefined,
        source: 'retrieve-session',
        capturedAt: new Date().toISOString(),
      },
    };
  }

  fromWebhook(payload: DiditWebhookEnvelope, trust: DiditWebhookTrust): NormalizedDiditKycResult {
    const rawStatus = payload.status ?? 'Unknown';
    const trustedDecision = trust !== 'envelope-only';
    return {
      provider: 'DIDIT',
      providerSessionId: payload.session_id ?? payload.business_session_id ?? '',
      vendorData: payload.vendor_data,
      workflowId: payload.workflow_id,
      rawStatus,
      decision: this.mapStatus(rawStatus),
      trustedDecision,
      requiresRefetch: !trustedDecision || this.isTerminal(rawStatus),
      features: {
        document: 'UNKNOWN',
        nfc: 'UNKNOWN',
        liveness: 'UNKNOWN',
        faceMatch: 'UNKNOWN',
        poa: 'UNKNOWN',
        aml: 'UNKNOWN',
        ip: 'UNKNOWN',
        email: 'UNKNOWN',
        phone: 'UNKNOWN',
        database: 'UNKNOWN',
        questionnaire: 'UNKNOWN',
      },
      warnings: [],
      evidence: {
        sessionHash: this.sha256(payload),
        decisionHash: payload.decision ? this.sha256(payload.decision) : undefined,
        source: 'webhook',
        capturedAt: new Date().toISOString(),
      },
    };
  }

  mapStatus(status: DiditSessionStatus | undefined): RegeneraKycDecision {
    const value = String(status ?? '').trim().toUpperCase();
    if (['APPROVED', 'VERIFIED'].includes(value)) return 'APPROVED';
    if (['DECLINED', 'REJECTED'].includes(value)) return 'REJECTED';
    if (['IN REVIEW', 'REVIEW', 'RESUBMITTED'].includes(value)) return 'MANUAL_REVIEW';
    if (['ABANDONED'].includes(value)) return 'ABANDONED';
    if (['EXPIRED', 'KYC EXPIRED'].includes(value)) return 'EXPIRED';
    if (['NOT STARTED', 'IN PROGRESS', 'AWAITING USER', 'PENDING'].includes(value)) return 'PROCESSING';
    return 'PROVIDER_ERROR';
  }

  private isTerminal(status: DiditSessionStatus | undefined): boolean {
    return ['APPROVED', 'DECLINED', 'IN REVIEW', 'ABANDONED', 'EXPIRED', 'KYC EXPIRED'].includes(
      String(status ?? '').trim().toUpperCase(),
    );
  }

  private aggregate(items?: Array<Record<string, unknown>> | null, aml = false): DiditFeatureStatus {
    if (!items) return 'NOT_RUN';
    if (items.length === 0) return 'NOT_RUN';
    const mapped = items.map((item) => this.mapFeatureItem(item, aml));
    if (mapped.includes('FAILED')) return 'FAILED';
    if (mapped.includes('REVIEW')) return 'REVIEW';
    if (mapped.includes('PENDING')) return 'PENDING';
    if (mapped.every((status) => status === 'PASSED')) return 'PASSED';
    return 'UNKNOWN';
  }

  private mapFeatureItem(item: Record<string, unknown>, aml: boolean): DiditFeatureStatus {
    const text = [
      item.status,
      item.result,
      item.decision,
      item.verification_status,
      item.screening_status,
      item.match_status,
    ]
      .filter((value): value is string => typeof value === 'string')
      .join(' ')
      .toUpperCase();

    if (!text) return 'UNKNOWN';

    if (aml) {
      if (text.includes('NO HIT') || text.includes('NO_HIT') || text.includes('CLEAR') || text.includes('APPROVED')) {
        return 'PASSED';
      }
      if (text.includes('POSSIBLE') || text.includes('REVIEW') || text.includes('INCONCLUSIVE')) {
        return 'REVIEW';
      }
      if (text.includes('HIT') || text.includes('MATCH') || text.includes('DECLINED')) {
        return 'FAILED';
      }
    }

    if (text.includes('APPROVED') || text.includes('PASSED') || text.includes('VERIFIED') || text.includes('VALID')) {
      return 'PASSED';
    }
    if (text.includes('DECLINED') || text.includes('REJECTED') || text.includes('FAILED') || text.includes('INVALID')) {
      return 'FAILED';
    }
    if (text.includes('REVIEW') || text.includes('RESUBMIT') || text.includes('WARNING')) {
      return 'REVIEW';
    }
    if (text.includes('PENDING') || text.includes('PROCESS')) {
      return 'PENDING';
    }
    return 'UNKNOWN';
  }

  private collectWarnings(report: DiditRetrieveSessionResponse): string[] {
    const warnings = new Set<string>();
    const scan = (value: unknown): void => {
      if (Array.isArray(value)) return value.forEach(scan);
      if (!value || typeof value !== 'object') return;
      const record = value as Record<string, unknown>;
      for (const key of ['warning', 'warnings', 'feedback_codes', 'reason', 'reasons']) {
        const candidate = record[key];
        if (typeof candidate === 'string' && candidate.trim()) warnings.add(candidate.trim());
        if (Array.isArray(candidate)) {
          for (const item of candidate) if (typeof item === 'string' && item.trim()) warnings.add(item.trim());
        }
      }
      Object.values(record).forEach(scan);
    };
    scan(report);
    return Array.from(warnings).slice(0, 30);
  }

  private sha256(value: unknown): string {
    return createHash('sha256').update(diditCanonicalJson(value)).digest('hex');
  }
}
