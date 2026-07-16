import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { Pool } from 'pg';
import { runChannelMigrations } from './db/migration-runner';
import { resolveChannelPersistenceMode } from './identity/channel-identity.service';

@Injectable()
export class ChannelPersistenceBootstrap implements OnModuleInit {
  private readonly logger = new Logger(ChannelPersistenceBootstrap.name);

  constructor(@Optional() private readonly pool?: Pool) {}

  async onModuleInit(): Promise<void> {
    if (resolveChannelPersistenceMode() !== 'postgres' || !this.pool) {
      return;
    }
    const results = await runChannelMigrations(this.pool);
    for (const r of results) {
      this.logger.log(
        `Migration ${r.version}: ${r.applied ? 'applied' : r.skipped ? 'skipped' : 'unknown'}`,
      );
    }
  }
}