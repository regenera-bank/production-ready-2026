import { Injectable } from '@nestjs/common';
import {
  EXTERNAL_ACTIVATION_REQUIRED,
  AnalyticsAdapterKind,
  AnalyticsCommand,
  AnalyticsHealth,
  AnalyticsPort,
  AnalyticsResult,
} from '../../ports/analytics.port';

@Injectable()
export class AnalyticsProductionAdapter implements AnalyticsPort {
  readonly kind: AnalyticsAdapterKind = 'production';

  async health(): Promise<AnalyticsHealth> {
    throw EXTERNAL_ACTIVATION_REQUIRED('analytics', 'production');
  }

  async execute(_command: AnalyticsCommand): Promise<AnalyticsResult> {
    throw EXTERNAL_ACTIVATION_REQUIRED('analytics', 'production');
  }
}
