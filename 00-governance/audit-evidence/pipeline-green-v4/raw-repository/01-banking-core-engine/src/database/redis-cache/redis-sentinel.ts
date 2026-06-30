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
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
|---------------------------------------------------------------------------------------|
*/

import Redis from 'ioredis';

export const sentinelClient = new Redis({
  sentinels: [
    { host: process.env.REDIS_SENTINEL_1, port: 26379 },
    { host: process.env.REDIS_SENTINEL_2, port: 26379 },
  ],
  name: 'mymaster',
  role: 'master',
});

export async function checkCacheHealth() {
  try {
    const info = await sentinelClient.info();
    return { status: 'healthy', info: info.substring(0, 100) };
  } catch (err) {
    return { status: 'unhealthy', error: err.message };
  }
}
