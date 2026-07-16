import { DynamicModule, Module, Provider } from '@nestjs/common';
import { NotificationsProductionAdapter } from './adapters/production/notifications-production.adapter';
import { NotificationsSandboxAdapter } from './adapters/sandbox/notifications-sandbox.adapter';
import { NotificationsSimulatorAdapter } from './adapters/simulator/notifications-simulator.adapter';
import { NOTIFICATIONS_PORT, NotificationsAdapterKind } from './ports/notifications.port';
import { NotificationsService } from './notifications.service';

export interface NotificationsModuleOptions {
  adapter?: NotificationsAdapterKind;
}

function resolveAdapter(options?: NotificationsModuleOptions): NotificationsAdapterKind {
  const fromEnv = process.env.NOTIFICATIONS_ADAPTER as NotificationsAdapterKind | undefined;
  return options?.adapter ?? fromEnv ?? 'simulator';
}

function adapterProvider(kind: NotificationsAdapterKind): Provider {
  const map = {
    simulator: NotificationsSimulatorAdapter,
    sandbox: NotificationsSandboxAdapter,
    production: NotificationsProductionAdapter,
  } as const;
  const impl = map[kind];
  return { provide: NOTIFICATIONS_PORT, useClass: impl };
}

@Module({})
export class NotificationsModule {
  static register(options?: NotificationsModuleOptions): DynamicModule {
    const kind = resolveAdapter(options);
    return {
      module: NotificationsModule,
      providers: [adapterProvider(kind), NotificationsService],
      exports: [NotificationsService, NOTIFICATIONS_PORT],
    };
  }
}
