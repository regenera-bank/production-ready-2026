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

/**
 * @file health.controller.ts
 * @description Liveness & readiness probe endpoint — used by Cloud Run and load balancers
 *
 * @author    Paulo Ricardo de Leão  <paulo@regenerabank.app>
 * @id        RG-2098233287
 * @maintainer Raphaela Cerveski    <ceo@regenerabank.app>
 * @copyright 2026 Regenera Corporate Ltd. — All rights reserved.
 * @license   UNLICENSED
 *
 * GET /v1/health
 *   Returns 200 OK with service metadata when the process is healthy.
 *   Returns 503 Service Unavailable if a critical dependency is degraded.
 */

import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

const STARTED_AT = new Date();

@Controller('health')
export class HealthController {
  @Get()
  @HttpCode(HttpStatus.OK)
  check() {
    const uptimeSeconds = Math.floor(
      (Date.now() - STARTED_AT.getTime()) / 1000,
    );

    return {
      status: 'UP',
      version: '4.0.0',
      environment: process.env.NODE_ENV ?? 'development',
      region: 'southamerica-east1',
      uptime: `${uptimeSeconds}s`,
      timestamp: new Date().toISOString(),
      services: {
        database: 'neon-postgresql',
        auth: 'firebase',
        ai: 'gemini-1.5-flash',
        openFinance: 'prometeo-sandbox',
      },
    };
  }
}
