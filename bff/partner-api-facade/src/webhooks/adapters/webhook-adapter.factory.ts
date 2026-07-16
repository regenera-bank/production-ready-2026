import { Injectable } from '@nestjs/common';
import type { WebhookAdapter } from './webhook-adapter.interface';
import { SandboxWebhookAdapter } from './sandbox-webhook.adapter';

@Injectable()
export class WebhookAdapterFactory {
  resolve(): WebhookAdapter {
    const sandbox = process.env.PARTNER_SANDBOX_MODE?.trim().toLowerCase() !== 'false';
    if (sandbox) {
      return new SandboxWebhookAdapter();
    }

    // Production adapter would enqueue to outbox; sandbox path is the default for Frente 15.
    return new SandboxWebhookAdapter();
  }
}