/**
 * Academy port — contract boundary for Financial education content.
 */
export const ACADEMY_PORT = Symbol('ACADEMY_PORT');

export type AcademyAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface AcademyHealth {
  ok: boolean;
  domain: 'academy';
  adapter: AcademyAdapterKind;
}

export interface AcademyCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface AcademyResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface AcademyPort {
  readonly kind: AcademyAdapterKind;
  health(): Promise<AcademyHealth>;
  execute(command: AcademyCommand): Promise<AcademyResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
