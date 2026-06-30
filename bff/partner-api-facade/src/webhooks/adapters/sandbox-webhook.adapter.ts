import { randomUUID } from 'node:crypto';
import type {
  WebhookAdapter,
  WebhookDeliveryRequest,
  WebhookDeliveryResponse,
} from './webhook-adapter.interface';
import { signWebhook } from '../webhook-signature';

/**
 * Sandbox adapter: performs signed HTTP delivery without external queue infrastructure.
 * Production would swap to a durable outbox + retry worker via WebhookAdapterFactory.
 */
export class SandboxWebhookAdapter implements WebhookAdapter {
  readonly mode = 'sandbox' as const;

  async deliver(request: WebhookDeliveryRequest): Promise<WebhookDeliveryResponse> {
    const deliveryId = randomUUID();
    const attemptedAt = new Date().toISOString();
    const body = Buffer.from(JSON.stringify(request.payload));
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signWebhook(Buffer.from(request.secret), timestamp, body);

    try {
      const response = await fetch(request.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-regenera-signature': signature,
          'x-regenera-timestamp': String(timestamp),
          'x-correlation-id': request.correlationId,
        },
        body,
        signal: AbortSignal.timeout(5_000),
      });

      return {
        deliveryId,
        status: response.ok ? 'DELIVERED' : 'FAILED',
        attemptedAt,
        httpStatus: response.status,
        error: response.ok ? null : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        deliveryId,
        status: 'FAILED',
        attemptedAt,
        httpStatus: null,
        error: error instanceof Error ? error.message : 'delivery failed',
      };
    }
  }
}