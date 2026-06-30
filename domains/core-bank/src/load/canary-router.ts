import { createHash } from 'crypto';
import { CANARY_TRAFFIC_PERCENT } from './canary-gate.config';

export interface CanaryDecision {
  readonly routeToCanary: boolean;
  readonly bucket: number;
  readonly trafficPercent: number;
}

export class CanaryRouter {
  constructor(private readonly trafficPercent: number = CANARY_TRAFFIC_PERCENT) {
    if (trafficPercent < 0 || trafficPercent > 100) {
      throw new Error('trafficPercent deve estar entre 0 e 100');
    }
  }

  decide(stableKey: string): CanaryDecision {
    const digest = createHash('sha256').update(stableKey).digest();
    const bucket = digest[0]! % 100;
    return {
      routeToCanary: bucket < this.trafficPercent,
      bucket,
      trafficPercent: this.trafficPercent,
    };
  }

  sampleRate(keys: readonly string[]): number {
    if (keys.length === 0) {
      return 0;
    }
    const routed = keys.filter((key) => this.decide(key).routeToCanary).length;
    return routed / keys.length;
  }
}