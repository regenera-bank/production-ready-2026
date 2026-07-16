/**
 * Pix port — contract boundary for PIX engine + SPI/DICT integration surface.
 * Delegation: production path targets @regenera/core-bank — see README.md.
 */
export const PIX_PORT = Symbol('PIX_PORT');

export type PixAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface PixHealth {
  ok: boolean;
  domain: 'pix';
  adapter: PixAdapterKind;
}

export interface PixCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface PixResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface PixPort {
  readonly kind: PixAdapterKind;
  health(): Promise<PixHealth>;
  execute(command: PixCommand): Promise<PixResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
