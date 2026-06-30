import { Injectable } from '@nestjs/common';
import {
  AnalyticsAdapterKind,
  AnalyticsCommand,
  AnalyticsHealth,
  AnalyticsPort,
  AnalyticsResult,
} from '../../ports/analytics.port';

@Injectable()
export class AnalyticsSimulatorAdapter implements AnalyticsPort {
  readonly kind: AnalyticsAdapterKind = 'simulator';
  private readonly ledger = new Map<string, AnalyticsResult>();

  async health(): Promise<AnalyticsHealth> {
    return { ok: true, domain: 'analytics', adapter: 'simulator' };
  }

  async execute(command: AnalyticsCommand): Promise<AnalyticsResult> {

    const existing = this.ledger.get(command.idempotencyKey);
    if (existing) {
      return existing;
    }
    const result: AnalyticsResult = {
      referenceId: `sim-analytics-${command.idempotencyKey}`,
      status: 'ACCEPTED',
      metadata: {
        simulated: true,
        principalId: command.principalId,
        payloadKeys: Object.keys(command.payload).sort(),
      },
    };
    this.ledger.set(command.idempotencyKey, result);
    return result;
  }
}
