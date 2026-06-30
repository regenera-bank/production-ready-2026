import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { AiResponseDto } from './ai.dto';

const FALLBACK_MODEL = 'gemini-2.5-flash';
const FAST_MODEL = process.env.GEMINI_FAST_MODEL?.trim() || FALLBACK_MODEL;
const THINKING_MODEL =
  process.env.GEMINI_THINKING_MODEL?.trim() || FALLBACK_MODEL;
const SEARCH_MODEL = process.env.GEMINI_SEARCH_MODEL?.trim() || FALLBACK_MODEL;
const MAPS_MODEL = process.env.GEMINI_MAPS_MODEL?.trim() || FALLBACK_MODEL;
const TTS_MODEL =
  process.env.GEMINI_TTS_MODEL?.trim() || 'gemini-2.5-flash-preview-tts';

const BASE_INSTRUCTION = `
Identidade: Raphaela — assistente do Regenera Bank.
Responda apenas JSON válido, sem markdown.

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

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  /** Apenas chaves dedicadas ao Gemini — nunca reutilizar FIREBASE_API_KEY. */
  static resolveGeminiApiKeys(): string[] {
    const raw = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_FALLBACK,
    ]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));
    return [...new Set(raw)];
  }

  static useVertex(): boolean {
    return process.env.GEMINI_USE_VERTEX?.trim().toLowerCase() === 'true';
  }

  static resolveVertexProject(): string | undefined {
    return (
      process.env.GEMINI_GCP_PROJECT_ID?.trim() ||
      process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
      undefined
    );
  }

  static resolveVertexLocation(): string {
    return process.env.GEMINI_VERTEX_LOCATION?.trim() || 'us-central1';
  }

  static isGeminiConfigured(): boolean {
    if (AiService.useVertex() && AiService.resolveVertexProject()) {
      return true;
    }
    return AiService.resolveGeminiApiKeys().length > 0;
  }

  static resolveGeminiApiKey(): string | undefined {
    return AiService.resolveGeminiApiKeys()[0];
  }

  private client(apiKey: string): GoogleGenAI {
    return new GoogleGenAI({ apiKey });
  }

  private vertexClient(): GoogleGenAI {
    const project = AiService.resolveVertexProject();
    if (!project) {
      throw new ServiceUnavailableException(
        'GEMINI_GCP_PROJECT_ID ausente — necessário para Vertex AI (pós-pagamento GCP)',
      );
    }
    return new GoogleGenAI({
      vertexai: true,
      project,
      location: AiService.resolveVertexLocation(),
    });
  }

  async chat(message: string, context: string): Promise<AiResponseDto> {
    const msg = message.toLowerCase();

    let selectedModel = FAST_MODEL;
    const config: Record<string, unknown> = {
      systemInstruction: BASE_INSTRUCTION,
      responseMimeType: 'application/json',
    };

    const usePreview =
      process.env.GEMINI_ENABLE_PREVIEW?.trim().toLowerCase() === 'true';

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

    const response = await this.generateWithFallback({
      model: selectedModel,
      contents: `${context}\n\n[MENSAGEM]:\n"${message}"`,
      config,
    });

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
    let parsed: AiResponseDto = { text: '...', action: 'none' };

    try {
      let clean = raw.trim().replace(/```json/g, '').replace(/```/g, '').trim();
      const start = clean.indexOf('{');
      const end = clean.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        clean = clean.substring(start, end + 1);
        parsed = JSON.parse(clean) as AiResponseDto;
      } else if (selectedModel === MAPS_MODEL) {
        parsed = { text: raw, action: 'map_search' };
      } else {
        parsed = { text: raw, action: 'none' };
      }
    } catch {
      parsed = { text: raw.substring(0, 300), action: 'none' };
    }

    if (searchResults.length > 0) {
      parsed.searchResults = searchResults as AiResponseDto['searchResults'];
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

    if (AiService.useVertex()) {
      providers.push({ label: 'vertex', client: this.vertexClient() });
    }

    for (const apiKey of AiService.resolveGeminiApiKeys()) {
      providers.push({
        label: `key:${apiKey.slice(0, 6)}…`,
        client: this.client(apiKey),
      });
    }

    if (providers.length === 0) {
      throw new ServiceUnavailableException(
        'Gemini ausente — defina GEMINI_USE_VERTEX=true + GEMINI_GCP_PROJECT_ID ou GEMINI_API_KEY em bff/web-bff/.env',
      );
    }

    let lastError: unknown;
    for (const provider of providers) {
      try {
        return await this.generateWithModelRetry(provider.client, params);
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Gemini falhou (${provider.label}): ${this.errorMessage(error)}`,
        );
        const tryNext = isForbidden(error) || isRateLimited(error);
        if (!tryNext) {
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
              `Gemini 429 em ${attempt.model} — aguardando 2s e tentando de novo`,
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
          ? 'Créditos Prepay do AI Studio esgotados — use GEMINI_USE_VERTEX=true (pós-pagamento GCP) ou recarregue em https://aistudio.google.com/billing'
          : 'Limite de requisições do Gemini (429) — aguarde 1 minuto e tente de novo',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (isForbidden(error)) {
      return new HttpException(
        'Chave sem permissão para Gemini (403). No Google Cloud: ative a API "Generative Language API" no projeto e inclua-a nas restrições da chave AIza — ou defina GEMINI_API_KEY_FALLBACK com chave do AI Studio (https://aistudio.google.com/apikey)',
        HttpStatus.FORBIDDEN,
      );
    }
    const detail = this.errorMessage(error);
    return new ServiceUnavailableException(
      `Gemini indisponível — verifique GEMINI_API_KEY no BFF: ${detail}`,
    );
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
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