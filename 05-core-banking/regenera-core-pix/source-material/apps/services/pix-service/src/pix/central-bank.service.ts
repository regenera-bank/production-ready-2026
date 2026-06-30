/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: PIX Service - Central Bank SPI Mock
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] apps/services/pix-service/src/pix/central-bank.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { AppConfigService } from '@repo/config'; // Use AppConfigService

@Injectable()
export class CentralBankService {
  private readonly logger = new Logger(CentralBankService.name);

  constructor(private readonly appConfigService: AppConfigService) {
    const spiClientId = this.appConfigService.get<string>('SPI_CLIENT_ID');
    const spiClientSecret = this.appConfigService.get<string>('SPI_CLIENT_SECRET');

    if (!spiClientId || !spiClientSecret) {
      this.logger.warn('Central Bank SPI credentials are not configured. Using mock integration.');
    } else {
      this.logger.log('Central Bank SPI configured for real integration (using AppConfigService).');
    }
  }

  /**
   * Validates the format of a PIX key based on common types.
   * This is a simplified regex for demonstration.
   */
  private validatePixKeyFormat(pixKey: string): boolean {
    const cpfRegex = /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/;
    const cnpjRegex = /^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+\d{2}\d{2,3}\d{4,5}\d{4}$/; // E.g., +5511987654321

    return cpfRegex.test(pixKey) || cnpjRegex.test(pixKey) || emailRegex.test(pixKey) || phoneRegex.test(pixKey);
  }

  /**
   * Simulates calling the Central Bank SPI to initiate or confirm a PIX transaction.
   * @param transactionDetails Details of the PIX transaction.
   * @returns A mock response indicating success or failure.
   */
  async initiatePixTransaction(transactionDetails: {
    amountInCents: number;
    sourceAccountId: string;
    destinationPixKey: string;
  }): Promise<{ success: boolean; spiTransactionId?: string; message?: string }> {
    this.logger.log(`--- CENTRAL BANK SPI MOCK (Enhanced) ---`);
    this.logger.log(`Initiating PIX for: ${JSON.stringify(transactionDetails)}`);

    const { amountInCents, destinationPixKey } = transactionDetails;

    // Simulate real-world PIX key validation
    if (!this.validatePixKeyFormat(destinationPixKey)) {
        this.logger.warn(`Invalid PIX key format: ${destinationPixKey}`);
        return { success: false, message: "Invalid PIX key format. Please provide a valid CPF, CNPJ, phone, or email key." };
    }

    // Simulate minimum and maximum amount limits
    if (amountInCents < 100) { // Minimum R$ 1.00
        this.logger.warn(`Amount below minimum limit: ${amountInCents}`);
        return { success: false, message: "Amount is below the minimum allowed for PIX transactions (R$ 1.00)." };
    }
    if (amountInCents > 100000000) { // Maximum R$ 1,000,000.00
        this.logger.warn(`Amount above maximum limit: ${amountInCents}`);
        return { success: false, message: "Amount exceeds the maximum allowed for PIX transactions (R$ 1,000,000.00)." };
    }
    
    // Simulate latency and potential external system failures
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));

    // Simulate various types of failures based on key or random chance
    if (destinationPixKey === "fail@spi.com") {
        this.logger.error("Simulated SPI failure for specific PIX key.");
        return { success: false, message: "Central Bank SPI rejected transaction for security reasons." };
    }
    if (Math.random() < 0.05) { // 5% chance of transient network failure
      this.logger.error("Simulated transient network error with Central Bank SPI.");
      throw new InternalServerErrorException("Central Bank SPI unreachable due to network issues.");
    }

    // Simulate a successful SPI interaction
    const spiTransactionId = `spi_tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    this.logger.log(`PIX transaction successfully registered with Central Bank SPI. ID: ${spiTransactionId}`);
    return {
      success: true,
      spiTransactionId: spiTransactionId,
      message: "PIX transaction registered with Central Bank SPI."
    };
  }
}