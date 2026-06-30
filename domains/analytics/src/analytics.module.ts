import { DynamicModule, Module, Provider } from '@nestjs/common';
import { AnalyticsProductionAdapter } from './adapters/production/analytics-production.adapter';
import { AnalyticsSandboxAdapter } from './adapters/sandbox/analytics-sandbox.adapter';
import { AnalyticsSimulatorAdapter } from './adapters/simulator/analytics-simulator.adapter';
import { ANALYTICS_PORT, AnalyticsAdapterKind } from './ports/analytics.port';
import { AnalyticsService } from './analytics.service';

export interface AnalyticsModuleOptions {
  adapter?: AnalyticsAdapterKind;
}

function resolveAdapter(options?: AnalyticsModuleOptions): AnalyticsAdapterKind {
  const fromEnv = process.env.ANALYTICS_ADAPTER as AnalyticsAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: AnalyticsAdapterKind): Provider {
  const map = {
    simulator: AnalyticsSimulatorAdapter,
    sandbox: AnalyticsSandboxAdapter,
    production: AnalyticsProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: ANALYTICS_PORT, useClass: impl };
}

@Module({})
export class AnalyticsModule {
  static register(options?: AnalyticsModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: AnalyticsModule,
      providers: [adapterProvider(kind), AnalyticsService],
      exports: [AnalyticsService, ANALYTICS_PORT],
    };
  }
}
