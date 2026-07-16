import { Injectable } from '@nestjs/common';
import {
  AnalyticsAdapterKind,
  AnalyticsCommand,
  AnalyticsHealth,
  AnalyticsPort,
  AnalyticsResult,
} from '../../ports/analytics.port';

@Injectable()
export class AnalyticsSandboxAdapter implements AnalyticsPort {
  readonly kind: AnalyticsAdapterKind = 'sandbox';
  private readonly store = new Map<string, AnalyticsResult>();

  async health(): Promise<AnalyticsHealth> {
    return { ok: true, domain: 'analytics', adapter: 'sandbox' };
  }

  async execute(command: AnalyticsCommand): Promise<AnalyticsResult> {
    const cached = this.store.get(command.idempotencyKey);
    if (cached) {
      return cached;
    }
    const result: AnalyticsResult = {
      referenceId: `sbx-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: { tier: 'sandbox', principalId: command.principalId },
    };
    this.store.set(command.idempotencyKey, result);
    return result;
  }
}
