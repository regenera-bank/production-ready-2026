export type ConsentType =
  | 'TERMS_OF_USE'
  | 'PRIVACY_POLICY'
  | 'MARKETING'
  | 'OPEN_FINANCE';

export type ConsentChannel = 'web' | 'android' | 'ios' | 'pwa';

export interface ConsentRecord {
  readonly id: string;
  readonly userId: string;
  readonly type: ConsentType;
  readonly version: string;
  readonly acceptedAt: string;
  revokedAt?: string;
  readonly channel: ConsentChannel;
}

export interface StoredPasskeyRecord {
  readonly credentialId: string;
  readonly publicKeyBase64: string;
  counter: number;
  readonly transports?: string[];
}

export interface SandboxAuditEntry {
  readonly id: string;
  readonly userId: string;
  readonly domain: 'lifestyle' | 'products' | 'prometeo';
  readonly moduleId?: string;
  readonly action: string;
  readonly referenceId: string;
  readonly status: string;
  readonly at: string;
  readonly payload?: Record<string, unknown>;
}

export interface AncillarySnapshot {
  consents: Record<string, ConsentRecord[]>;
  passkeys: Record<string, StoredPasskeyRecord[]>;
  prometeoPayments: Record<string, Record<string, unknown>>;
  prometeoProcessedEventIds: Record<string, string>;
}

export const emptyAncillarySnapshot = (): AncillarySnapshot => ({
  consents: {},
  passkeys: {},
  prometeoPayments: {},
  prometeoProcessedEventIds: {},
});