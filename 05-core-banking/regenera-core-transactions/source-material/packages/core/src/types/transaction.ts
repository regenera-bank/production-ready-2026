/*
═══════════════════════════════════════════════════════════════════════════════
  REGENERA BANK - CORE TRANSACTION SERVICE
  Module: Core Domain Types
   
  Developer: Don Paulo Ricardo
  CEO: Raphaela Cervesky
   
  ORCID: https://orcid.org/0009-0002-1934-3559
  Copyright © 2025 Regenera Ecosystem. All rights reserved.
═══════════════════════════════════════════════════════════════════════════════
*/

// [FILE] packages/core/src/types/transaction.ts

import { Money } from "../value-objects/money";

export interface Transaction {
  id: string;
  amount: Money;
  senderId: string;
  receiverId: string;
  timestamp: Date;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface FraudAnalysisResult {
  riskLevel: 'SAFE' | 'MODERATE' | 'CRITICAL';
  score: number;
  reason?: string;
}

/*
╔══════════════════════════════════════════════════════════════════════════╗
║  REGENERA BANK - PRODUCTION BUILD                                        ║
║  System Status: Stable & Secure                                          ║
║  © 2025 Don Paulo Ricardo de Leão • Todos os direitos reservados         ║
╚══════════════════════════════════════════════════════════════════════════╝
*/
