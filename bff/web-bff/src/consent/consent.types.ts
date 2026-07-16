import type { ConsentRecord, ConsentType } from '@regenera/channel-persistence';

export type { ConsentRecord, ConsentType };

export const CONSENT_VERSION = '2026-07-01';

export const REQUIRED_CONSENT_TYPES: ConsentType[] = [
  'TERMS_OF_USE',
  'PRIVACY_POLICY',
];

export interface AcceptConsentInput {
  readonly type: ConsentType;
  readonly channel?: string;
}

export interface ConsentStatusResponse {
  readonly required: ConsentType[];
  readonly accepted: ConsentRecord[];
  readonly pending: ConsentType[];
  readonly complete: boolean;
}