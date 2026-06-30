/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Compliance Service
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/compliance-service/src/compliance/compliance.service.ts
import { Injectable } from '@nestjs/common';
import { CheckTransactionDto } from './dto/check-transaction.dto';
import { CheckUserDto } from './dto/check-user.dto';
import { SanctionBureauService } from './sanction-bureau.service'; // Import the new service

type ComplianceStatus = 'CLEARED' | 'FLAGGED_AML' | 'FLAGGED_SANCTION' | 'FLAGGED_KYC';

@Injectable()
export class ComplianceService {
  constructor(private readonly sanctionBureauService: SanctionBureauService) {}

  /**
   * Simulates an AML (Anti-Money Laundering) check for a transaction.
   * This now includes a call to the external Sanction Bureau.
   */
  async checkTransaction(dto: CheckTransactionDto): Promise<{ status: ComplianceStatus; reason?: string }> {
    console.log(`Compliance Check: Transaction ${dto.transactionId} for User ${dto.userId}`);
    
    // Step 1: Check against internal AML rules (mocked)
    if (dto.amount > 5000000) { // Over R$ 50.000,00
      return { status: 'FLAGGED_AML', reason: 'Large transaction amount.' };
    }
    if (dto.recipientId.includes('suspicious')) { // Mock suspicious recipient
      return { status: 'FLAGGED_AML', reason: 'Suspicious recipient pattern.' };
    }

    // Step 2: Check recipient against sanction lists via external bureau (mocked)
    const sanctionCheck = await this.sanctionBureauService.checkSanctionList(dto.recipientId);
    if (sanctionCheck.isSanctioned) {
      return { status: 'FLAGGED_SANCTION', reason: sanctionCheck.reason || 'Recipient found on sanction list.' };
    }

    return { status: 'CLEARED' };
  }

  /**
   * Simulates a KYC (Know Your Customer) check for a user.
   * This now includes a call to the external Sanction Bureau for the user.
   */
  async checkUser(dto: CheckUserDto): Promise<{ status: ComplianceStatus; reason?: string }> {
    console.log(`Compliance Check: User ${dto.userId} (${dto.email})`);
    
    // Step 1: Check against internal KYC rules (mocked)
    if (dto.email.includes('fake')) { // Mock fake user
      return { status: 'FLAGGED_KYC', reason: 'Email pattern suggests fake user.' };
    }

    // Step 2: Check user against sanction lists via external bureau (mocked)
    const sanctionCheck = await this.sanctionBureauService.checkSanctionList(dto.userId);
    if (sanctionCheck.isSanctioned) {
      return { status: 'FLAGGED_SANCTION', reason: sanctionCheck.reason || 'User found on sanction list.' };
    }

    return { status: 'CLEARED' };
  }
}
/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
