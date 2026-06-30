/*
|---------------------------------------------------------------------------------------|
|  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
|---------------------------------------------------------------------------------------|

PROJECT:       Regenera Bank
CEO:           Raphaela Cerveski
DEVELOPER:     Don Paulo Ricardo
ID:            2098233287
COPYRIGHT:     Copyright (c) 2026 Regenera Corporate

LICENSE:       EULA (End-User License Agreement)
PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA

WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
               engenharia reversa ou modificação não autorizada.

|---------------------------------------------------------------------------------------|
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW    |
|---------------------------------------------------------------------------------------|
*/

import 'reflect-metadata';
import { config } from 'dotenv';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import type { TlsOptions } from 'tls';
import { DataSource } from 'typeorm';

config();

type TypeOrmRuntime = 'ts' | 'js';

const resolveTypeOrmRuntime = (): TypeOrmRuntime => {
  const runtime = (process.env.TYPEORM_RUNTIME ?? 'ts').toLowerCase();

  if (runtime === 'ts' || runtime === 'js') {
    return runtime;
  }

  throw new Error(
    `[RegeneraBank/DataSource] Invalid TYPEORM_RUNTIME="${runtime}". Use "ts" or "js".`,
  );
};

const nodeEnv = process.env.NODE_ENV ?? 'development';
const isProduction = nodeEnv === 'production';
const typeOrmRuntime = resolveTypeOrmRuntime();
const isJavascriptRuntime = typeOrmRuntime === 'js';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    '[RegeneraBank/DataSource] DATABASE_URL is required for TypeORM migrations and runtime database access.',
  );
}

const normalizeGlob = (path: string): string => path.replace(/\\/g, '/');

const projectRoot = process.env.TYPEORM_ROOT_DIR ?? process.cwd();

const entitiesGlobs = isJavascriptRuntime
  ? [normalizeGlob(join(projectRoot, 'dist/**/*.entity.js'))]
  : [normalizeGlob(join(projectRoot, 'src/**/*.entity.ts'))];

const migrationsGlobs = isJavascriptRuntime
  ? [
      normalizeGlob(join(projectRoot, 'dist/database/migrations/*.js')),
      normalizeGlob(join(projectRoot, 'dist/src/database/migrations/*.js')),
    ]
  : [normalizeGlob(join(projectRoot, 'src/database/migrations/*.ts'))];

const readDatabaseCaCertificate = (): string | undefined => {
  if (process.env.DB_CA_CERT) {
    return process.env.DB_CA_CERT.replace(/\\n/g, '\n');
  }

  if (process.env.DB_CA_CERT_PATH) {
    const certificatePath = process.env.DB_CA_CERT_PATH;

    if (!existsSync(certificatePath)) {
      throw new Error(
        `[RegeneraBank/DataSource] DB_CA_CERT_PATH does not exist: ${certificatePath}`,
      );
    }

    return readFileSync(certificatePath, 'utf8');
  }

  return undefined;
};

const buildSslOptions = (): false | TlsOptions => {
  const shouldUseSsl = isProduction || process.env.DB_SSL === 'true';

  if (!shouldUseSsl) {
    return false;
  }

  if (isProduction && process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false') {
    throw new Error(
      '[RegeneraBank/DataSource] DB_SSL_REJECT_UNAUTHORIZED=false is not allowed in production.',
    );
  }

  const ca = readDatabaseCaCertificate();

  return {
    rejectUnauthorized:
      process.env.DB_SSL_REJECT_UNAUTHORIZED === 'false' && !isProduction
        ? false
        : true,
    ...(ca ? { ca } : {}),
  };
};

const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  ssl: buildSslOptions(),
  entities: entitiesGlobs,
  migrations: migrationsGlobs,
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
});

export default AppDataSource;
