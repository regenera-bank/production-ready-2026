import { DynamicModule, Module, Provider } from '@nestjs/common';
import { RewardsProductionAdapter } from './adapters/production/rewards-production.adapter';
import { RewardsSandboxAdapter } from './adapters/sandbox/rewards-sandbox.adapter';
import { RewardsSimulatorAdapter } from './adapters/simulator/rewards-simulator.adapter';
import { REWARDS_PORT, RewardsAdapterKind } from './ports/rewards.port';
import { RewardsService } from './rewards.service';

export interface RewardsModuleOptions {
  adapter?: RewardsAdapterKind;
}

function resolveAdapter(options?: RewardsModuleOptions): RewardsAdapterKind {
  const fromEnv = process.env.REWARDS_ADAPTER as RewardsAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: RewardsAdapterKind): Provider {
  const map = {
    simulator: RewardsSimulatorAdapter,
    sandbox: RewardsSandboxAdapter,
    production: RewardsProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: REWARDS_PORT, useClass: impl };
}

@Module({})
export class RewardsModule {
  static register(options?: RewardsModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: RewardsModule,
      providers: [adapterProvider(kind), RewardsService],
      exports: [RewardsService, REWARDS_PORT],
    };
  }
}
