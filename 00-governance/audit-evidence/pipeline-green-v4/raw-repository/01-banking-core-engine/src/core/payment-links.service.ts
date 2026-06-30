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

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

/**
 * Payment Links Service - Integrates with Prometeo Payment Links API.
 */
@Injectable()
export class PaymentLinksService {
  private readonly logger = new Logger(PaymentLinksService.name);

  private readonly PROMETEO_API_KEY = process.env.PROMETEO_API_KEY; // from Secret Manager only - never hardcoded
  private readonly PROMETEO_BASE_URL =
    'https://banking.sandbox.prometeoapi.com';

  async createPaymentLink(
    neuralId: string,
    amount: number,
    description?: string,
  ) {
    this.logger.log(
      `Creating Payment Link via Prometeo for ${neuralId}: R$ ${amount}`,
    );

    if (!this.PROMETEO_API_KEY) {
      throw new Error(
        'PROMETEO_API_KEY must come from Secret Manager (injected in Cloud Run)',
      );
    }
    try {
      // Real Prometeo call (key from SM)
      const response = await axios.post(
        `${this.PROMETEO_BASE_URL}/payment-links/`,
        {
          amount,
          description: description || 'Regenera Link',
          currency: 'BRL',
        },
        { headers: { 'X-API-Key': this.PROMETEO_API_KEY } },
      );
      return response.data;
    } catch (error) {
      this.logger.error('Prometeo Payment Links API Integration Error', error);
      throw new HttpException(
        'Falha ao gerar link de pagamento.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
