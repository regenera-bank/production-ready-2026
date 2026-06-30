export enum IdempotencyState {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  UNKNOWN = 'UNKNOWN',
  FAILED_RETRYABLE = 'FAILED_RETRYABLE',
  FAILED_FINAL = 'FAILED_FINAL',
}

export interface IdempotencyRecord {
  idempotencyKey: string;
  payloadHash: string;
  state: IdempotencyState;
  responseReference: string | null;
  createdAt: string;
  updatedAt: string;
}

export type IdempotencyBeginResult =
  | { action: 'ACQUIRED'; record: IdempotencyRecord }
  | { action: 'REPLAY'; record: IdempotencyRecord; responseReference: string }
  | { action: 'BLOCKED'; record: IdempotencyRecord; reason: 'UNKNOWN' | 'PROCESSING' | 'FAILED_FINAL' };