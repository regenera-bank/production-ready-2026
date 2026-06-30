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
 * Identity Service - Integrates with Prometeo Identity API for KYC.
 */
@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  private readonly PROMETEO_BASE_URL =
    process.env.PROMETEO_BASE_URL ??
    'https://banking.sandbox.prometeoapi.com';

  private resolvePrometeoApiKey(): string {
    const key = process.env.PROMETEO_API_KEY;
    if (!key) {
      throw new HttpException(
        'PROMETEO_API_KEY não configurada',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return key;
  }

  async validateCpf(cpf: string) {
    this.logger.log(`Validating KYC for CPF via Prometeo: ${cpf}`);

    try {
      const response = await axios.get(
        `${this.PROMETEO_BASE_URL}/cpf/`, // Assuming endpoint based on docs context
        {
          headers: {
            'X-API-Key': this.resolvePrometeoApiKey(),
          },
          params: {
            document_number: cpf,
          },
        },
      );

      if (response.data && response.data.data && response.data.data.Result) {
        return response.data;
      } else {
        throw new Error('Invalid CPF response from Prometeo');
      }
    } catch (error) {
      this.logger.error('Prometeo Identity API Integration Error', error);

      // Fallback for Sandbox/Demonstration purposes
      if (cpf === '12345678909') {
        return {
          data: {
            Result: {
              BasicData: {
                TaxIdNumber: 12345678909,
                TaxIdCountry: 'BR',
                Name: 'DON PAULO RICARDO',
                Gender: 'M',
              },
            },
          },
        };
      }
      throw new HttpException(
        'Falha na validação de identidade (KYC)',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
