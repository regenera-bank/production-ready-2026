/**
 * Devices port — contract boundary for Device trust and binding.
 */
export const DEVICES_PORT = Symbol('DEVICES_PORT');

export type DevicesAdapterKind = 'simulator' | 'sandbox' | 'production';

export interface DevicesHealth {
  ok: boolean;
  domain: 'devices';
  adapter: DevicesAdapterKind;
}

export interface DevicesCommand {
  idempotencyKey: string;
  principalId: string;
  payload: Record<string, unknown>;
}

export interface DevicesResult {
  referenceId: string;
  status: 'ACCEPTED' | 'REJECTED' | 'UNKNOWN';
  metadata?: Record<string, unknown>;
}

export interface DevicesPort {
  readonly kind: DevicesAdapterKind;
  health(): Promise<DevicesHealth>;
  execute(command: DevicesCommand): Promise<DevicesResult>;
}

export const EXTERNAL_ACTIVATION_REQUIRED = (domain: string, adapter: string): Error =>
  Object.assign(new Error(`[${domain}] adapter "${adapter}" requires external activation — see README.md`), {
    code: 'EXTERNAL_ACTIVATION_REQUIRED',
    domain,
    adapter,
  });
