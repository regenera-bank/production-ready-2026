import { Inject, Injectable } from '@nestjs/common';
import { ANALYTICS_PORT, AnalyticsCommand, AnalyticsPort, AnalyticsResult } from './ports/analytics.port';

@Injectable()
export class AnalyticsService {
  constructor(@Inject(ANALYTICS_PORT) private readonly port: AnalyticsPort) {}

  health() {
    return this.port.health();
  }

  execute(command: AnalyticsCommand): Promise<AnalyticsResult> {
    return this.port.execute(command);
  }
}
