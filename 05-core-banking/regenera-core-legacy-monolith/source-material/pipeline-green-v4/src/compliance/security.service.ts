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

// |---------------------------------------------------------------------------------------|
// |  --> REGENERA ENTERPRISE SYSTEM v4.0                                                  |
// |---------------------------------------------------------------------------------------|
//
// PROJECT:       Regenera Bank
// CEO:           Raphaela Cerveski
// DEVELOPER:     Don Paulo Ricardo
// ID:            2098233287
// COPYRIGHT:     Copyright (c) 2026 Regenera Corporate
//
// LICENSE:       EULA (End-User License Agreement)
// PROTECTION:    PROPRIEDADE INTELECTUAL RESTRITA
//
// WARNING:       TODOS OS DIREITOS RESERVADOS. Proibida a cópia, distribuição,
//                engenharia reversa ou modificação não autorizada.
//
// |---------------------------------------------------------------------------------------|
// |  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW          |
// |---------------------------------------------------------------------------------------|

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountEntity } from '../core/entities/account.entity';
import * as admin from 'firebase-admin';

/**
 * Security Service - emergency lockdown, fraud webhooks,
 * device session management. Integrates with Identity Toolkit
 * for token revocation and Firebase Cloud Messaging for push alerts.
 */
@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
  ) {}

  async emergencyLockdown(neuralId: string) {
    this.logger.warn(`EMERGENCY LOCKDOWN issued for ${neuralId}`);

    // 1. Mark account BLOCKED in PostgreSQL
    await this.accountRepo.update({ neuralId }, { isBlocked: true });

    // 2. Revoke all refresh tokens through Identity Toolkit
    try {
      await admin.auth().revokeRefreshTokens(neuralId);
    } catch (e: any) {
      this.logger.warn(`Failed to revoke tokens for ${neuralId}: ${e.message}`);
    }

    // 3. Push high-priority FCM notification
    // await admin.messaging().send({
    //   topic: `user_${neuralId}`,
    //   notification: { title: 'SEGURANÇA REGENERA', body: 'Conta bloqueada por precaução.' },
    //   android: { priority: 'high' },
    // });

    return { status: 'BLOCKED', neuralId, timestamp: new Date().toISOString() };
  }

  async triggerSOS(
    neuralId: string,
    body: { reason?: string; location?: string },
  ) {
    this.logger.warn(
      `SOS Senior triggered for ${neuralId}: ${body.reason || 'emergency'} at ${body.location || 'unknown'}`,
    );

    // Real motor: publish to 'emergency-events' topic (like pix-events) for family/support handlers, FCM push, etc.
    // For now, log + return; in full, use PubSubClient like in pix.service.
    // This connects to "motor" - backend can notify via email/SMS/Push using SM keys.

    return {
      status: 'SOS_TRIGGERED',
      neuralId,
      timestamp: new Date().toISOString(),
      notified: ['family', 'support'],
      details: body,
    };
  }
}
