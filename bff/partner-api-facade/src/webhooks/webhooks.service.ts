import { Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { PartnerApiException } from '../common/partner-api.exception';
import { WebhookAdapterFactory } from './adapters/webhook-adapter.factory';

export type WebhookSubscription = {
  id: string;
  clientId: string;
  url: string;
  events: string[];
  secret: string;
  status: 'ACTIVE' | 'DISABLED';
  createdAt: string;
};

@Injectable()
export class WebhooksService {
  private readonly subscriptions = new Map<string, WebhookSubscription>();

  constructor(private readonly adapterFactory: WebhookAdapterFactory) {}

  list(clientId: string) {
    return [...this.subscriptions.values()]
      .filter((item) => item.clientId === clientId)
      .map(({ secret: _secret, ...rest }) => rest);
  }

  register(
    clientId: string,
    input: { url: string; events: string[]; secret?: string },
  ): Omit<WebhookSubscription, 'secret'> {
    const id = randomUUID();
    const subscription: WebhookSubscription = {
      id,
      clientId,
      url: input.url,
      events: input.events,
      secret: input.secret ?? randomBytes(24).toString('base64url'),
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    this.subscriptions.set(id, subscription);
    const { secret: _secret, ...rest } = subscription;
    return rest;
  }

  delete(clientId: string, subscriptionId: string): void {
    const existing = this.subscriptions.get(subscriptionId);
    if (!existing || existing.clientId !== clientId) {
      throw new PartnerApiException('RBK-VAL-001', 404, 'Subscription not found');
    }
    this.subscriptions.delete(subscriptionId);
  }

  async testDelivery(
    clientId: string,
    input: { subscriptionId: string; eventType: string; payload?: Record<string, unknown> },
  ) {
    const subscription = this.subscriptions.get(input.subscriptionId);
    if (!subscription || subscription.clientId !== clientId) {
      throw new PartnerApiException('RBK-VAL-001', 404, 'Subscription not found');
    }
    if (!subscription.events.includes(input.eventType)) {
      throw new PartnerApiException('RBK-VAL-001', 422, 'Event not subscribed');
    }

    const correlationId = randomUUID();
    const payload = {
      eventId: randomUUID(),
      eventType: input.eventType,
      eventVersion: 1,
      occurredAt: new Date().toISOString(),
      correlationId,
      ...(input.payload ?? { paymentId: randomUUID(), status: 'SETTLED' }),
    };

    const adapter = this.adapterFactory.resolve();
    return adapter.deliver({
      url: subscription.url,
      secret: subscription.secret,
      eventType: input.eventType,
      payload,
      correlationId,
    });
  }
}