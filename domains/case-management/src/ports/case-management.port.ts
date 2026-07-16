/**
 * CaseManagement port — contract boundary for Investigation cases and maker-checker.
 */
export const CASE_MANAGEMENT_PORT = Symbol('CASE_MANAGEMENT_PORT');

export type CaseManagementAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface CaseManagementHealth {
  ok: boolean;
  domain: 'case-management';
  adapter: CaseManagementAdapterKind;
}

export interface CaseManagementCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface CaseManagementResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface CaseManagementPort {
  readonly kind: CaseManagementAdapterKind;
  health(): Promise<CaseManagementHealth>;
  execute(command: CaseManagementCommand): Promise<CaseManagementResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
