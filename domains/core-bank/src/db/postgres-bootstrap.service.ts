import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { runMigrations } from './migration-runner';
import { POSTGRES_POOL } from '../storage/storage.tokens';

@Injectable()
export class PostgresBootstrapService implements OnModuleInit {
  constructor(@Inject(POSTGRES_POOL) private readonly pool: Pool) {}

  async onModuleInit(): Promise<void> {
    await runMigrations(this.pool);
  }
}