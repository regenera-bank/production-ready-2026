import { DynamicModule, Module, Provider } from '@nestjs/common';
import { EventsProductionAdapter } from './adapters/production/events-production.adapter';
import { EventsSandboxAdapter } from './adapters/sandbox/events-sandbox.adapter';
import { EventsSimulatorAdapter } from './adapters/simulator/events-simulator.adapter';
import { EVENTS_PORT, EventsAdapterKind } from './ports/events.port';
import { EventsService } from './events.service';

export interface EventsModuleOptions {
  adapter?: EventsAdapterKind;
}

function resolveAdapter(options?: EventsModuleOptions): EventsAdapterKind {
  const fromEnv = process.env.EVENTS_ADAPTER as EventsAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: EventsAdapterKind): Provider {
  const map = {
    simulator: EventsSimulatorAdapter,
    sandbox: EventsSandboxAdapter,
    production: EventsProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: EVENTS_PORT, useClass: impl };
}

@Module({})
export class EventsModule {
  static register(options?: EventsModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: EventsModule,
      providers: [adapterProvider(kind), EventsService],
      exports: [EventsService, EVENTS_PORT],
    };
  }
}
