import { DynamicModule, Module, Provider } from '@nestjs/common';
import { CaseManagementProductionAdapter } from './adapters/production/case-management-production.adapter';
import { CaseManagementSandboxAdapter } from './adapters/sandbox/case-management-sandbox.adapter';
import { CaseManagementSimulatorAdapter } from './adapters/simulator/case-management-simulator.adapter';
import { CASE_MANAGEMENT_PORT, CaseManagementAdapterKind } from './ports/case-management.port';
import { CaseManagementService } from './case-management.service';

export interface CaseManagementModuleOptions {
  adapter?: CaseManagementAdapterKind;
}

function resolveAdapter(options?: CaseManagementModuleOptions): CaseManagementAdapterKind {
  const fromEnv = process.env.CASE_MANAGEMENT_ADAPTER as CaseManagementAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: CaseManagementAdapterKind): Provider {
  const map = {
    simulator: CaseManagementSimulatorAdapter,
    sandbox: CaseManagementSandboxAdapter,
    production: CaseManagementProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: CASE_MANAGEMENT_PORT, useClass: impl };
}

@Module({})
export class CaseManagementModule {
  static register(options?: CaseManagementModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: CaseManagementModule,
      providers: [adapterProvider(kind), CaseManagementService],
      exports: [CaseManagementService, CASE_MANAGEMENT_PORT],
    };
  }
}
