import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { AssistantResponseDto } from './assistant.dto';

const FALLBACK_MODEL = 'gemini-2.5-flash';
const FAST_MODEL = process.env.ASSISTANT_FAST_MODEL?.trim() || FALLBACK_MODEL;
const THINKING_MODEL =
  process.env.ASSISTANT_THINKING_MODEL?.trim() || FALLBACK_MODEL;
const SEARCH_MODEL = process.env.ASSISTANT_SEARCH_MODEL?.trim() || FALLBACK_MODEL;
const MAPS_MODEL = process.env.ASSISTANT_MAPS_MODEL?.trim() || FALLBACK_MODEL;
const TTS_MODEL =
  process.env.ASSISTANT_TTS_MODEL?.trim() || 'gemini-2.5-flash-preview-tts';

const BASE_INSTRUCTION = `
Identidade: Raphaela — assistente do Regenera Bank.
Respfase apenas JSON válido, sem markdown.

Estrutura:
{
  "text": "resposta falada",
  "action": "ACTION_KEY",
  "params": {}
}

Ações: navigate, statement_insights, manifesto, pix_send, pix_receive, transfer_send,
show_balance, toggle_balance, block_card, invest_suggestion, market_check,
fraud_scan, map_search, send_telegram, change_theme, search_transactions, none.

Exemplos:
"Esconde saldo" → {"text":"Saldo oculto.","action":"toggle_balance","params":{}}
"Pix 100 reais pro João" → {"text":"Abrindo Pix.","action":"pix_send","params":{"value":100,"to":"João"}}
`;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const errorText = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const isRateLimited = (error: unknown): boolean => {
  const message = errorText(error);
  return (
    message.includes('429') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.toLowerCase().includes('quota') ||
    message.toLowerCase().includes('rate limit')
  );
};

const isForbidden = (error: unknown): boolean => {
  const message = errorText(error);
  return (
    message.includes('403') ||
    message.includes('PERMISSION_DENIED') ||
    message.toLowerCase().includes('forbidden')
  );
};

/** Vertex ADC expirada ou sessão Google revogada — tenta próximo provider (API key). */
const isAuthRefreshError = (error: unknown): boolean => {
  const message = errorText(error).toLowerCase();
  return (
    message.includes('invalid_grant') ||
    message.includes('invalid_rapt') ||
    message.includes('reauth') ||
    message.includes('unauthenticated')
  );
};

const shouldTryNextProvider = (error: unknown): boolean =>
  isForbidden(error) || isRateLimited(error) || isAuthRefreshError(error);

const homologAiDegraded = (): boolean => {
  const provider = process.env.KYC_PROVIDER?.trim().toLowerCase();
  return provider === 'firebase' || provider === 'homolog';
};

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  /** Apenas chaves dedicadas ao Assistente — nunca reutilizar FIREBASE_API_KEY. */
  static resolveAssistenteApiKeys(): string[] {
    const raw = [
      process.env.ASSISTANT_API_KEY,
      process.env.ASSISTANT_API_KEY_FALLBACK,
    ]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));
    return [...new Set(raw)];
  }

  static useVertex(): boolean {
    return (process.env.ASSISTANT_USE_VERTEX || process.env.GEMINI_USE_VERTEX)?.trim().toLowerCase() === 'true';
  }

  static resolveVertexProject(): string | undefined {
    return (
      (process.env.ASSISTANT_GCP_PROJECT_ID || process.env.GEMINI_GCP_PROJECT_ID)?.trim() ||
      process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
      undefined
    );
  }

  static resolveVertexLocation(): string {
    return (process.env.ASSISTANT_VERTEX_LOCATION || process.env.GEMINI_VERTEX_LOCATION)?.trim() || 'us-central1';
  }

  static isAssistantConfigured(): boolean {
    if (AssistantService.useVertex() && AssistantService.resolveVertexProject()) {
      return true;
    }
    return AssistantService.resolveAssistenteApiKeys().length > 0;
  }

  static resolveAssistenteApiKey(): string | undefined {
    return AssistantService.resolveAssistenteApiKeys()[0];
  }

  private client(apiKey: string): GoogleGenAI {
    return new GoogleGenAI({ apiKey });
  }

  private vertexClient(): GoogleGenAI {
    const project = AssistantService.resolveVertexProject();
    if (!project) {
      throw new ServiceUnavailableException(
        'ASSISTANT_GCP_PROJECT_ID ausente — necessário para Vertex AI (pós-pagamento GCP)',
      );
    }
    return new GoogleGenAI({
      vertexai: true,
      project,
      location: AssistantService.resolveVertexLocation(),
    });
  }

  async chat(message: string, context: string): Promise<AssistantResponseDto> {
    const msg = message.toLowerCase();

    let selectedModel = FAST_MODEL;
    const config: Record<string, unknown> = {
      systemInstruction: BASE_INSTRUCTION,
      responseMimeType: 'application/json',
    };

    const usePreview =
      process.env.ASSISTANT_ENABLE_PREVIEW?.trim().toLowerCase() === 'true';

    if (
      usePreview &&
      (msg.includes('onde') ||
        msg.includes('fica') ||
        msg.includes('mapa') ||
        msg.includes('endereço') ||
        msg.includes('restaurante') ||
        msg.includes('atm'))
    ) {
      selectedModel = MAPS_MODEL;
      config.tools = [{ googleMaps: {} }];
      delete config.responseMimeType;
    } else if (
      usePreview &&
      (msg.includes('preço') ||
        msg.includes('cotação') ||
        msg.includes('notícias') ||
        msg.includes('quem é'))
    ) {
      selectedModel = SEARCH_MODEL;
      config.tools = [{ googleSearch: {} }];
    } else if (
      usePreview &&
      (msg.length > 50 ||
        msg.includes('analise') ||
        msg.includes('investir') ||
        msg.includes('planejamento'))
    ) {
      selectedModel = THINKING_MODEL;
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    let response;
    try {
      response = await this.generateWithFallback({
        model: selectedModel,
        contents: `${context}\n\n[MENSAGEM]:\n"${message}"`,
        config,
      });
    } catch (error) {
      if (
        homologAiDegraded() &&
        (isForbidden(error) ||
          isAuthRefreshError(error) ||
          isRateLimited(error))
      ) {
        this.logger.warn(
          'Assistente indisponível em homolog — Raphaela modo degradado (ações locais)',
        );
        return this.homologDegradedChat(message);
      }
      throw error;
    }

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const searchResults =
      groundingMetadata?.groundingChunks
        ?.flatMap((chunk) => {
          const title = chunk.web?.title;
          const uri = chunk.web?.uri;
          if (!title || !uri) return [];
          return [{ title, url: uri }];
        }) ?? [];

    const raw = response.text ?? '{}';
    let parsed: AssistantResponseDto = { text: '...', action: 'none' };

    try {
      let clean = raw.trim().replace(/```json/g, '').replace(/```/g, '').trim();
      const start = clean.indexOf('{');
      const end = clean.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        clean = clean.substring(start, end + 1);
        parsed = JSON.parse(clean) as AssistantResponseDto;
      } else if (selectedModel === MAPS_MODEL) {
        parsed = { text: raw, action: 'map_search' };
      } else {
        parsed = { text: raw, action: 'none' };
      }
    } catch {
      parsed = { text: raw.substring(0, 300), action: 'none' };
    }

    if (searchResults.length > 0) {
      parsed.searchResults = searchResults as AssistantResponseDto['searchResults'];
    }
    if (selectedModel === MAPS_MODEL && parsed.action === 'none') {
      parsed.action = 'map_search';
    }

    return parsed;
  }

  private async generateWithFallback(params: {
    model: string;
    contents: string;
    config: Record<string, unknown>;
  }) {
    const providers: Array<{ label: string; client: GoogleGenAI }> = [];

    if (AssistantService.useVertex()) {
      providers.push({ label: 'vertex', client: this.vertexClient() });
    }

    for (const apiKey of AssistantService.resolveAssistenteApiKeys()) {
      providers.push({
        label: `key:${apiKey.slice(0, 6)}…`,
        client: this.client(apiKey),
      });
    }

    if (providers.length === 0) {
      throw new ServiceUnavailableException(
        'Assistente ausente — defina ASSISTANT_USE_VERTEX=true + ASSISTANT_GCP_PROJECT_ID ou ASSISTANT_API_KEY em bff/web-bff/.env',
      );
    }

    let lastError: unknown;
    for (const provider of providers) {
      try {
        return await this.generateWithModelRetry(provider.client, params);
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Assistente falhou (${provider.label}): ${this.errorMessage(error)}`,
        );
        if (!shouldTryNextProvider(error)) {
          break;
        }
      }
    }

    throw this.toHttpException(lastError);
  }

  private async generateWithModelRetry(
    ai: GoogleGenAI,
    params: {
      model: string;
      contents: string;
      config: Record<string, unknown>;
    },
  ) {
    const attempts: Array<{ model: string; config: Record<string, unknown> }> = [
      { model: params.model, config: params.config },
    ];

    if (params.model !== FALLBACK_MODEL) {
      const liteConfig = { ...params.config };
      delete liteConfig.tools;
      delete liteConfig.thinkingConfig;
      liteConfig.responseMimeType = 'application/json';
      attempts.push({ model: FALLBACK_MODEL, config: liteConfig });
    }

    let lastError: unknown;
    for (const attempt of attempts) {
      for (let retry = 0; retry < 2; retry += 1) {
        try {
          return await ai.models.generateContent({
            model: attempt.model,
            contents: params.contents,
            config: attempt.config,
          });
        } catch (error) {
          lastError = error;
          if (isRateLimited(error) && retry === 0) {
            this.logger.warn(
              `Assistente 429 em ${attempt.model} — aguardando 2s e tentando de novo`,
            );
            await sleep(2000);
            continue;
          }
          break;
        }
      }
    }

    throw lastError;
  }

  private toHttpException(error: unknown): HttpException {
    if (isRateLimited(error)) {
      const prepay = errorText(error).toLowerCase().includes('prepayment');
      return new HttpException(
        prepay
          ? 'Créditos Prepay do AI Studio esgotados — use ASSISTANT_USE_VERTEX=true (pós-pagamento GCP) ou recarregue em https://aistudio.google.com/billing'
          : 'Limite de requisições do Assistente (429) — aguarde 1 minuto e tente de novo',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (isForbidden(error)) {
      return new HttpException(
        'Chave sem permissão para Assistente (403). No Google Cloud: ative a API "Generative Language API" no projeto e inclua-a nas restrições da chave AIza — ou defina ASSISTANT_API_KEY_FALLBACK com chave do AI Studio (https://aistudio.google.com/apikey)',
        HttpStatus.FORBIDDEN,
      );
    }
    const detail = this.errorMessage(error);
    return new ServiceUnavailableException(
      `Assistente indisponível — verifique ASSISTANT_API_KEY no BFF: ${detail}`,
    );
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  /** Homolog sem ADC/Assistente: ações de navegação locais (canal não trava). */
  private homologDegradedChat(message: string): AssistantResponseDto {
    const msg = message.toLowerCase();
    if (msg.includes('saldo') || msg.includes('quanto tenho')) {
      return {
        text: 'Consultando seu saldo no painel.',
        action: 'show_balance',
        params: {},
      };
    }
    if (msg.includes('pix') && (msg.includes('enviar') || msg.includes('mandar'))) {
      return { text: 'Abrindo Pix para envio.', action: 'pix_send', params: {} };
    }
    if (msg.includes('pix')) {
      return { text: 'Abrindo área Pix.', action: 'pix_receive', params: {} };
    }
    if (msg.includes('transfer') || msg.includes('ted')) {
      return {
        text: 'Abrindo transferências.',
        action: 'transfer_send',
        params: {},
      };
    }
    if (msg.includes('extrato') || msg.includes('lançamento')) {
      return {
        text: 'Abrindo extrato.',
        action: 'search_transactions',
        params: {},
      };
    }
    if (msg.includes('esconde') && msg.includes('saldo')) {
      return {
        text: 'Saldo oculto.',
        action: 'toggle_balance',
        params: {},
      };
    }
    return {
      text: 'Raphaela em homolog — reconecte gcloud auth application-default login para IA completa.',
      action: 'none',
      params: {},
    };
  }

  async speak(text: string, voice = 'Kore'): Promise<string | null> {
    const response = await this.generateWithFallback({
      model: TTS_MODEL,
      contents: text,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    return (
      response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data ?? null
    );
  }

  async sendTelegram(message: string): Promise<{ ok: boolean; detail?: string }> {
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
    const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
    if (!token || !chatId) {
      throw new ServiceUnavailableException(
        'Telegram não configurado no BFF (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)',
      );
    }

    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `[Raphaela] ${message}`,
        }),
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      return { ok: false, detail };
    }
    return { ok: true };
  }
}