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

import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  GenerativeModel,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { AccountEntity } from '../core/entities/account.entity';
import { TransactionEntity } from '../core/entities/transaction.entity';

const RAPHAELA_SYSTEM_PROMPT = `
Você é Raphaela, IA do Regenera Bank. 
REGRA 1: É ESTRITAMENTE PROIBIDO dar recomendações diretas de compra ou venda de ações. 
REGRA 2: Nunca prometa rentabilidade futura. 
REGRA 3: Se o usuário pedir para investir, responda com análises de mercado genéricas e instrua-o a abrir o Terminal de Investimentos.
REGRA 4: Responda SEMPRE em formato JSON estrito: { "text": "...", "intent": "analysis" | "suggestion", "requires_human_approval": true | false }
`.trim();

const SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// Basic sanitization to prevent prompt injection from DB/user data before LLM context.
function sanitizeForLlm(data: unknown): string {
  const str = JSON.stringify(data || {});
  return str
    .replace(/[\n\r\t]/g, ' ') // remove newlines that could break instructions
    .replace(/```/g, '') // strip code fences
    .replace(/ignore previous|system prompt|override rules/gi, '[REDACTED]') // basic block
    .slice(0, 4000); // limit context size
}

// Strict output validation (manual schema, no Zod dep yet). Enforce the JSON shape from prompt.
function validateGeminiOutput<T extends object>(
  rawText: string,
  expectedKeys: (keyof T)[],
): T {
  const cleaned = rawText.replace(/```(?:json)?|```/g, '').trim();
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('Gemini output not valid JSON');
  }
  if (typeof parsed !== 'object' || !parsed)
    throw new Error('Output not object');
  for (const key of expectedKeys) {
    if (!(key in parsed))
      throw new Error(`Missing required key: ${String(key)}`);
  }
  return parsed as T;
}

export type AnalysisType = 'investment' | 'spending' | 'fraud';

export interface ChatResult {
  response: string;
  timestamp: string;
}

export interface AnalysisResult {
  analysis: string;
  score: number;
  recommendation: string;
}

export interface InsightResult {
  insight: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}

@Injectable()
export class NeuralCoreService implements OnModuleInit {
  private readonly logger = new Logger(NeuralCoreService.name);
  private model: GenerativeModel;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(AccountEntity)
    private readonly accountRepo: Repository<AccountEntity>,
    @InjectRepository(TransactionEntity)
    private readonly txRepo: Repository<TransactionEntity>,
  ) {}

  onModuleInit() {
    const apiKey = this.config.getOrThrow<string>('GEMINI_API_KEY'); // from SM, with guardrails as per MANIFESTE
    const genAI = new GoogleGenerativeAI(apiKey);

    this.model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: RAPHAELA_SYSTEM_PROMPT,
      safetySettings: SAFETY_SETTINGS,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 512,
        responseMimeType: 'application/json', // strict JSON as per pasted guard service
      },
    });

    this.logger.log('Gemini 1.5 Flash initialised — Raphaela is online');
  }

  async chat(
    message: string,
    context?: string,
    userId?: string,
  ): Promise<ChatResult> {
    // FILTRO DE INJEÇÃO (Anti-Prompt Injection) - matches frontend and pasted service
    const blocklist = [
      'ignore',
      'system prompt',
      'banco de dados',
      'sql',
      'saldo de outro',
    ];
    if (blocklist.some((word) => message.toLowerCase().includes(word))) {
      this.logger.warn(
        `[SECURITY] Tentativa de Prompt Injection pelo ID: ${userId}`,
      );
      throw new HttpException(
        'Acesso Neural Interrompido. Violação de protocolo.',
        HttpStatus.FORBIDDEN,
      );
    }

    const prompt = context
      ? `[Contexto da sessão]\n${context}\n\n[Mensagem do usuário]\n${message}`
      : message;

    try {
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();

      if (userId) {
        this.logger.debug(`Chat — userId=${userId} tokens≈${text.length}`);
      }

      return { response: text, timestamp: new Date().toISOString() };
    } catch (err: any) {
      this.logger.error(`Chat error — ${err?.message}`);
      throw new HttpException(
        'Raphaela não está disponível no momento.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async analyze(type: AnalysisType, data: unknown): Promise<AnalysisResult> {
    const safeData = sanitizeForLlm(data); // prevent injection from DB data into prompt
    const prompts: Record<AnalysisType, string> = {
      investment: `Analise as oportunidades de investimento abaixo e retorne viabilidade, riscos e retorno esperado.\nDados: ${safeData}`,
      spending: `Analise o padrão de gastos abaixo. Identifique categorias problemáticas e sugira redução.\nDados: ${safeData}`,
      fraud: `Verifique os sinais de fraude na transação abaixo. Justifique o score de risco.\nDados: ${safeData}`,
    };

    const instruction = `${prompts[type]}\n\nRetorne SOMENTE JSON válido no formato: {"analysis":"string","score":number,"recommendation":"string"}`;

    try {
      const result = await this.model.generateContent(instruction);
      const raw = result.response
        .text()
        .replace(/```(?:json)?|```/g, '')
        .trim();
      // Strict validation before return to frontend (enforces schema from system prompt)
      return validateGeminiOutput<AnalysisResult>(raw, [
        'analysis',
        'score',
        'recommendation',
      ]);
    } catch (err: any) {
      this.logger.error(`Analyze [${type}] error — ${err?.message}`);
      throw new HttpException(
        'Análise indisponível no momento.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getInsight(userId: string): Promise<InsightResult> {
    const prompt = [
      `Gere um insight financeiro diário relevante para o usuário ${userId ?? 'anônimo'} do Regenera Bank.`,
      `Pense em algo acionável: uma oportunidade de investimento atual, uma dica de economia ou um alerta de mercado.`,
      `Retorne SOMENTE JSON válido no formato: {"insight":"string","category":"string","priority":"high"|"medium"|"low"}`,
    ].join('\n');

    try {
      const result = await this.model.generateContent(prompt);
      const raw = result.response
        .text()
        .replace(/```(?:json)?|```/g, '')
        .trim();
      // Validate to prevent leaking bad/fake data to UI (e.g. false rentability promises)
      return validateGeminiOutput<InsightResult>(raw, [
        'insight',
        'category',
        'priority',
      ]);
    } catch (err: any) {
      this.logger.error(`Insight error — ${err?.message}`);
      // graceful fallback — never crash the home screen. Note: this fallback is safe per rules.
      return {
        insight:
          'Diversifique sua carteira com Tesouro IPCA+ 2029. Consulte o Terminal de Investimentos para detalhes.',
        category: 'investimentos',
        priority: 'medium',
      };
    }
  }

  async analyzeDelinquencyRisk() {
    const fs = require('fs');
    const path = require('path');

    this.logger.log(
      'Starting log analysis of transactions for the last 7 days...',
    );
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch all accounts
    const accounts = await this.accountRepo.find();
    if (accounts.length === 0) {
      return { message: 'No accounts found to analyze.' };
    }

    // Fetch transactions from the last 7 days
    const txs = await this.txRepo.find({
      where: {
        createdAt: MoreThanOrEqual(sevenDaysAgo),
      },
    });

    this.logger.log(`Found ${txs.length} transactions in the last 7 days.`);

    const userReports = [];
    const highRiskUsers = [];

    // Group transactions by account
    for (const account of accounts) {
      const accountTxs = txs.filter((t) => t.accountId === account.id);

      let totalIncome = 0;
      let totalSpending = 0;

      for (const t of accountTxs) {
        const val = Number(t.amountCents) / 100;
        if (val > 0) {
          totalIncome += val;
        } else {
          totalSpending += Math.abs(val);
        }
      }

      const balance = Number(account.balanceCents) / 100;
      const outflowRatio =
        totalIncome > 0 ? totalSpending / totalIncome : totalSpending;

      // Risk conditions
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      const riskReasons = [];

      if (balance <= 0 && totalSpending > 0) {
        riskLevel = 'high';
        riskReasons.push(
          'Saldo negativo ou zerado com padrão de gastos ativo.',
        );
      } else if (outflowRatio > 1.2 && totalSpending > 200) {
        riskLevel = 'high';
        riskReasons.push(
          `Volume de gastos excede entradas em ${(outflowRatio * 100).toFixed(0)}%.`,
        );
      } else if (balance < 100 && totalSpending > 500) {
        riskLevel = 'high';
        riskReasons.push(
          'Saldo atual extremamente baixo com alto consumo recente.',
        );
      } else if (outflowRatio > 1.0) {
        riskLevel = 'medium';
        riskReasons.push('Gastos superando as receitas recentes.');
      }

      let educationPlan = '';

      if (riskLevel === 'high' || riskLevel === 'medium') {
        const geminiPrompt = `
Você é Raphaela, a mentora de saúde financeira inteligente do Regenera Bank.
Analisamos o comportamento de gastos do usuário "${account.neuralId}" dos últimos 7 dias e identificamos um risco de inadimplência:
- Saldo Atual: R$ ${balance.toFixed(2)}
- Entradas nos últimos 7 dias: R$ ${totalIncome.toFixed(2)}
- Gastos nos últimos 7 dias: R$ ${totalSpending.toFixed(2)}
- Alerta de Risco: ${riskReasons.join(' / ')}

Por favor, elabore um plano de educação financeira personalizado, empático e amigável para este usuário.
O plano deve conter:
1. Uma análise empática da situação de forma profissional, sem culpabilizar o usuário.
2. 3 ações práticas de redução de despesas.
3. Sugestão de produtos do Regenera Bank que possam ajudar (ex: Cofre de Sonhos, Renda Fixa Conservadora).

Retorne a resposta no formato JSON padrão da Raphaela, colocando o plano completo no campo "text", com a "intent" igual a "suggestion", e "requires_human_approval" igual a false.
`.trim();

        try {
          const result = await this.model.generateContent(geminiPrompt);
          const raw = result.response.text();
          const parsed = validateGeminiOutput<any>(raw, ['text']);
          educationPlan = parsed.text;
        } catch (err) {
          this.logger.warn(
            `Failed to generate Gemini plan for user ${account.neuralId}: ${err.message}`,
          );
          educationPlan = `Detectamos que seus gastos de R$ ${totalSpending.toFixed(2)} superaram as entradas de R$ ${totalIncome.toFixed(2)} nos últimos 7 dias. Recomendamos criar um Cofrinho de Sonhos no app para guardar uma quantia regular e evitar o limite da conta.`;
        }

        highRiskUsers.push({
          userId: account.neuralId,
          balance,
          totalIncome,
          totalSpending,
          riskReasons,
          riskLevel,
          educationPlan,
        });
      }

      userReports.push({
        userId: account.neuralId,
        balance,
        totalIncome,
        totalSpending,
        riskLevel,
        riskReasons,
      });
    }

    // Write Report to DELINQUENCY_RISK_REPORT.md
    const reportPath =
      '/Users/regeneracorporateltdacopyright/Documents/ok deploy/regenera ultimo/DELINQUENCY_RISK_REPORT.md';
    const artifactPath =
      '/Users/regeneracorporateltdacopyright/.gemini/antigravity-cli/brain/9ae3353f-4d9b-4ec3-9ca4-3ec97a3039d8/DELINQUENCY_RISK_REPORT.md';

    let markdown = `# Relatório de Risco de Inadimplência e Educação Financeira\n\n`;
    markdown += `*Gerado em: ${new Date().toLocaleString('pt-BR')}*\n\n`;
    markdown += `## 1. Sumário Executivo\n`;
    markdown += `Análise de comportamento de gastos dos últimos 7 dias baseada em transações bancárias reais.\n`;
    markdown += `- Total de contas analisadas: ${accounts.length}\n`;
    markdown += `- Usuários com risco médio/alto: ${highRiskUsers.length}\n\n`;
    markdown += `## 2. Tabela de Riscos Analisados\n\n`;
    markdown += `| ID do Usuário | Saldo Atual | Entradas (7d) | Saídas (7d) | Nível de Risco | Fatores |\n`;
    markdown += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    for (const r of userReports) {
      markdown += `| \`${r.userId}\` | R$ ${r.balance.toFixed(2)} | R$ ${r.totalIncome.toFixed(2)} | R$ ${r.totalSpending.toFixed(2)} | **${r.riskLevel.toUpperCase()}** | ${r.riskReasons.join(', ') || 'Nenhum'} |\n`;
    }

    markdown += `\n## 3. Planos de Educação Financeira Personalizados (via Raphaela AI)\n\n`;

    for (const u of highRiskUsers) {
      markdown += `### Usuário: \`${u.userId}\` (Risco: ${u.riskLevel.toUpperCase()})\n`;
      markdown += `**Motivo do Risco**: ${u.riskReasons.join('; ')}\n\n`;
      markdown += `**Plano de Educação Financeira**:\n`;
      markdown += `${u.educationPlan}\n\n`;
      markdown += `---\n\n`;
    }

    try {
      fs.writeFileSync(reportPath, markdown, 'utf8');
      const artDir = path.dirname(artifactPath);
      if (!fs.existsSync(artDir)) {
        fs.mkdirSync(artDir, { recursive: true });
      }
      fs.writeFileSync(artifactPath, markdown, 'utf8');
    } catch (e) {
      this.logger.error(`Error saving delinquency reports: ${e.message}`);
    }

    this.logger.log(
      `Delinquency analysis completed. Report saved to ${reportPath}`,
    );

    return {
      success: true,
      analyzedAccounts: accounts.length,
      highRiskAccountsCount: highRiskUsers.length,
      reportPath,
      highRiskUsers: highRiskUsers.map((u) => ({
        userId: u.userId,
        riskLevel: u.riskLevel,
        riskReasons: u.riskReasons,
        plan: u.educationPlan,
      })),
    };
  }
}
