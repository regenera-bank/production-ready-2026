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
|  --> CLASSIFICATION: PROPRIETARY // DEVELOPER MAINTAINED // REQUIRES SENIOR REVIEW    |
|---------------------------------------------------------------------------------------|
*/

import {
  Injectable,
  Logger,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { BigQuery } from '@google-cloud/bigquery';
import { Storage } from '@google-cloud/storage';
import { CoreService } from '../core/core.service';
import { PepProvider } from './providers/pep.provider';

export interface AmlAnalysisResult {
  isPep: boolean;
  riskScore: number;
  action: 'CLEARED' | 'MANUAL_REVIEW' | 'FROZEN';
  reason?: string;
}

@Injectable()
export class ComplianceService {
  private readonly logger = new Logger('AML_ComplianceEngine');
  private bigquery: BigQuery;
  private storage: Storage;

  constructor(
    @Inject(forwardRef(() => CoreService))
    private readonly ledger: CoreService,
    @Inject('PEP_PROVIDER')
    private readonly pepProvider: PepProvider,
  ) {
    this.bigquery = new BigQuery();
    this.storage = new Storage();
  }

  /**
   * Avaliação de Prevenção a Lavagem de Dinheiro (PLD) e Pessoas Expostas Politicamente (PEP).
   * Executado via cron job noturno ou em tempo real para transferências de alto valor.
   */
  async analyzeTransactionRisk(
    neuralId: string,
    amountCents: number,
    originCpf: string,
  ): Promise<AmlAnalysisResult> {
    this.logger.log(
      `[AML] Iniciando análise de PLD para transação de ${amountCents}c no neuralId: ${neuralId}`,
    );

    // Integração via Adapter Explicitamente Injetado
    const pepResult = await this.pepProvider.check(originCpf);
    const isPep = pepResult.isPep;
    let riskScore = pepResult.score;

    // Se a transação for acima de R$ 100.000,00, aumenta o score substancialmente
    if (amountCents > 10000000) {
      riskScore += 30;
      this.logger.warn(
        `[AML ALERTA] Transação atípica de altíssimo valor (R$ ${(amountCents / 100).toFixed(2)}) detectada.`,
      );
    }

    // Regras de Congelamento Automático
    if (riskScore >= 90) {
      this.logger.error(
        `[AML CRÍTICO] Risco Severo (${riskScore}). Conta ${neuralId} será congelada pelo BACEN Circular 3.978.`,
      );
      await this.ledger.freezeAccount(neuralId, 'SUSPEITA_LAVAGEM_DINHEIRO');
      return {
        isPep,
        riskScore,
        action: 'FROZEN',
        reason: 'COAF_LIMIT_EXCEEDED',
      };
    }

    if (riskScore >= 60) {
      this.logger.warn(
        `[AML ALERTA] Risco Moderado (${riskScore}). Enviando para a mesa de operações (Review Manual).`,
      );
      return {
        isPep,
        riskScore,
        action: 'MANUAL_REVIEW',
        reason: 'PEP_OR_HIGH_VALUE',
      };
    }

    return { isPep, riskScore, action: 'CLEARED' };
  }

  /**
   * Geração de Documentos Fiscais (DARF/IRRF) usando BigQuery para agregar milhões de linhas.
   */
  async generateTaxDocument(neuralId: string, year: number) {
    this.logger.log(
      `[TAX COMPLIANCE] Emitindo DARF ${year} para conta ${neuralId}`,
    );

    try {
      const query = `
        SELECT SUM(amount) as taxable_income, COUNT(*) as tx_count
        FROM \`regenera-bank-prod.banking.transactions\`
        WHERE neural_id = @neuralId
          AND EXTRACT(YEAR FROM created_at) = @year
          AND tax_classification = 'TAXABLE'
      `;

      const [rows] = await this.bigquery.query({
        query,
        params: { neuralId, year },
      });
      const taxableIncomeCents = rows[0]?.taxable_income || 0;

      if (taxableIncomeCents === 0) {
        throw new BadRequestException(
          'Nenhum rendimento tributável detectado para o ano informado.',
        );
      }

      const taxDueCents = Math.floor(taxableIncomeCents * 0.15); // Alíquota simplificada de 15%
      const bucketName = process.env.GCS_BUCKET || 'regenera-tax-docs-secure';
      const fileName = `darf/${neuralId}/${year}-${Date.now()}.pdf`;

      // Simulação da geração de PDF do DARF em memória (PDFKit)
      const pdfBuffer = Buffer.from(
        `DARF ${year} - Imposto Devido: R$ ${(taxDueCents / 100).toFixed(2)}`,
      );

      await this.storage
        .bucket(bucketName)
        .file(fileName)
        .save(pdfBuffer, {
          metadata: { contentType: 'application/pdf' },
        });

      const [signedUrl] = await this.storage
        .bucket(bucketName)
        .file(fileName)
        .getSignedUrl({
          action: 'read',
          expires: Date.now() + 5 * 60 * 1000, // URL Autodestrutiva em 5 minutos
          version: 'v4',
        });

      return {
        success: true,
        downloadUrl: signedUrl,
        taxDueTotal: taxDueCents / 100,
        period: year,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      this.logger.error(
        `[TAX FALHA] Erro na comunicação com BigQuery ou Storage: ${error.message}`,
      );
      throw new BadRequestException(
        'Não foi possível gerar o informe de rendimentos no momento.',
      );
    }
  }
}
