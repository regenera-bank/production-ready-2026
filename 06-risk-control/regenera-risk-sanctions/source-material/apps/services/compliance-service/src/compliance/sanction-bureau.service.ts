/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Compliance Service - Sanction Bureau Mock
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/compliance-service/src/compliance/sanction-bureau.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AppConfigService } from '@repo/config'; // Import AppConfigService

@Injectable()
export class SanctionBureauService {
  constructor(private readonly appConfigService: AppConfigService) {
    const sanctionBureauApiKey = this.appConfigService.get<string>('SANCTION_BUREAU_API_KEY');

    if (!sanctionBureauApiKey) {
      console.warn('Sanction Bureau API key is not configured. Using mock integration.');
    } else {
      console.log('Sanction Bureau API configured (mocked).');
    }
  }

  /**
   * Simulates checking an entity (user or recipient) against sanction lists.
   * @param entityIdentifier A unique identifier for the entity (e.g., userId, accountId, email).
   * @returns A mock response indicating if the entity is sanctioned.
   */
  async checkSanctionList(entityIdentifier: string): Promise<{ isSanctioned: boolean; reason?: string }> {
    console.log(`--- SANCTION BUREAU API MOCK ---`);
    console.log(`Checking identifier: "${entityIdentifier}"`);
    
    // Simulate latency and external system failures
    await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 400));

    // Simple mock logic: Flag "evil" or "terror" in identifier
    if (entityIdentifier.toLowerCase().includes('evil') || entityIdentifier.toLowerCase().includes('terror')) {
      return { isSanctioned: true, reason: "Match found in OFAC/UN Sanction List (mock)." };
    }
    
    if (Math.random() < 0.03 && this.appConfigService.get<string>('SANCTION_BUREAU_API_KEY')) { // 3% chance of failure if key is set
        throw new InternalServerErrorException("Sanction Bureau API call failed due to external service error.");
    }

    return { isSanctioned: false };
  }
}
