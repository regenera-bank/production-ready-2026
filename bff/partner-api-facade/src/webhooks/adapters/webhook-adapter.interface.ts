export type WebhookDeliveryRequest = {
  url: string;
  secret: string;
  eventType: string;
  payload: Record<string, unknown>;
  correlationId: string;
};

export type WebhookDeliveryResponse = {
  deliveryId: string;
  status: 'QUEUED' | 'DELIVERED' | 'FAILED';
  attemptedAt: string;
  httpStatus: number | null;
  error: string | null;
};

export interface WebhookAdapter {
  readonly mode: 'sandbox' | 'production';
  deliver(request: WebhookDeliveryRequest): Promise<WebhookDeliveryResponse>;
}