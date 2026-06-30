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

import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import axios from 'axios';

/**
 * Open Finance Service - Integrates with Prometeo OpenBanking API.
 * Handles the mTLS connection via Sandbox / Production environments.
 */
@Injectable()
export class OpenFinanceService {
  private readonly logger = new Logger(OpenFinanceService.name);

  // Prometeo key from Secret Manager only (injected in Cloud Run)
  private readonly PROMETEO_API_KEY = process.env.PROMETEO_API_KEY;
  private readonly PROMETEO_BASE_URL =
    'https://banking.sandbox.prometeoapi.com';

  async fetchConnectedBanks(neuralId: string) {
    this.logger.log(
      `Fetching Open Finance balances via Prometeo API for ${neuralId}`,
    );

    try {
      // 1. Initial Login to the Open Finance Provider (Brazil)
      // According to Prometeo Docs, 'openfinance_br' is the provider code for all BR banks.
      const loginResponse = await axios.post(
        `${this.PROMETEO_BASE_URL}/login/`,
        new URLSearchParams({
          provider: 'openfinance_br',
          username: '12345', // sandbox test for this internal fetch (real CPF comes from frontend /open-finance)
          password: 'gfdsa',
        }).toString(),
        {
          headers: {
            'X-API-Key': this.PROMETEO_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      if (loginResponse.data.status !== 'logged_in') {
        throw new Error('Failed to authenticate with Prometeo API');
      }

      const sessionKey = loginResponse.data.key;

      // 2. Fetch Accounts using the Session Key
      const accountsResponse = await axios.get(
        `${this.PROMETEO_BASE_URL}/account/`,
        {
          headers: {
            'X-API-Key': this.PROMETEO_API_KEY,
          },
          params: {
            key: sessionKey,
          },
        },
      );

      if (accountsResponse.data.status !== 'success') {
        throw new Error('Failed to fetch accounts from Prometeo API');
      }

      // 3. Format and Return Data
      const accounts = accountsResponse.data.accounts || [];

      return accounts.map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        balance: acc.balance,
        connected: true,
        logoCode: acc.currency, // Using currency as logo placeholder for raw data
      }));
    } catch (error) {
      this.logger.error('Prometeo API Integration Error', error);
      throw new ServiceUnavailableException(
        'Serviço temporariamente indisponível',
      );
    }
  }
}
