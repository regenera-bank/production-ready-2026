export interface PrometeoPaymentWebhookPayload {
  readonly amount?: string;
  readonly concept?: string;
  readonly currency?: string;
  readonly origin_account?: string;
  readonly destination_account?: string;
  readonly destination_owner_name?: string;
  readonly destination_bank_code?: string;
  readonly request_id: string;
}

export interface PrometeoPaymentWebhookEvent {
  readonly event_type: string;
  readonly event_id: string;
  readonly timestamp: string;
  readonly payload: PrometeoPaymentWebhookPayload;
}

export interface PrometeoPaymentWebhookBody {
  readonly verify_token?: string;
  readonly events?: PrometeoPaymentWebhookEvent[];
}

export interface PrometeoTransferLog {
  readonly request_id: string;
  readonly origin_account?: string;
  readonly destination_account?: string;
  readonly destination_name?: string;
  readonly destination_institution_name?: string;
  readonly currency?: string;
  readonly amount?: string;
  readonly status?: string;
  readonly concept?: string;
  readonly created_at?: string;
  readonly operation_id?: string | null;
}

export type MonitoredPaymentStatus = 'NOTIFIED' | 'ENRICHED' | 'FAILED';

export interface MonitoredPaymentRecord {
  readonly requestId: string;
  readonly eventId: string;
  readonly eventType: string;
  readonly verifyTokenOk: boolean;
  readonly webhookReceivedAt: string;
  readonly prometeoTimestamp?: string;
  readonly amount?: string;
  readonly currency?: string;
  readonly concept?: string;
  readonly destinationOwnerName?: string;
  readonly status: MonitoredPaymentStatus;
  readonly transferDetail?: PrometeoTransferLog;
  readonly lastError?: string;
}