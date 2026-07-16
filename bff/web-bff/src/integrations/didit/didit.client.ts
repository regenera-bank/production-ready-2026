import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { readDiditConfig } from './didit.config';
import type {
  DiditCreateSessionInput,
  DiditCreateSessionResponse,
  DiditRetrieveSessionResponse,
} from './didit.types';

const MAX_VENDOR_DATA_CHARS = 512;
const MAX_JSON_BUDGET_BYTES = 8_192;
const MAX_ERROR_LOG_CHARS = 700;

type DiditMethod = 'GET' | 'POST';

type DiditRequest = {
  method: DiditMethod;
  path: string;
  body?: unknown;
  correlationId?: string;
};

type DiditFailure = {
  status: number;
  path: string;
  detail: string;
  providerCode?: string;
  requestId: string;
  retryable: boolean;
};

@Injectable()
export class DiditClient {
  private readonly logger = new Logger(DiditClient.name);

  isConfigured(): boolean {
    return Boolean(process.env.DIDIT_API_KEY?.trim());
  }

  resolveWorkflowId(): string {
    return readDiditConfig().workflowId;
  }

  async createSession(input: DiditCreateSessionInput): Promise<DiditCreateSessionResponse> {
    this.assertCreateSessionInput(input);
    const config = readDiditConfig();

    const body: Record<string, unknown> = {
      workflow_id: config.workflowId,
      vendor_data: input.vendorData.trim(),
      callback: input.callback.trim(),
      callback_method: input.callbackMethod ?? 'both',
    };

    if (input.language?.trim()) body.language = input.language.trim();
    if (input.metadata) body.metadata = this.withDiditMetadata(input.metadata, input);
    if (input.expectedDetails) body.expected_details = input.expectedDetails;

    if (input.contactEmail?.trim() || input.contactPhone?.trim()) {
      body.contact_details = {
        ...(input.contactEmail?.trim() ? { email: input.contactEmail.trim() } : {}),
        ...(input.contactPhone?.trim() ? { phone: input.contactPhone.trim() } : {}),
        send_notification_emails: input.sendNotificationEmails ?? false,
      };
    }

    if (config.sandboxScenario) body.sandbox_scenario = config.sandboxScenario;

    const response = await this.requestJson<DiditCreateSessionResponse>({
      method: 'POST',
      path: '/v3/session/',
      body,
      correlationId: input.correlationId,
    });

    this.assertCreateSessionResponse(response);
    return response;
  }

  async getSessionDecision(
    sessionId: string,
    correlationId?: string,
  ): Promise<DiditRetrieveSessionResponse> {
    const normalized = sessionId?.trim();
    if (!normalized) throw new BadRequestException('DIDIT_SESSION_ID_REQUIRED');
    if (!/^[A-Za-z0-9._:-]{6,180}$/.test(normalized)) {
      throw new BadRequestException('DIDIT_SESSION_ID_INVALID');
    }

    return this.requestJson<DiditRetrieveSessionResponse>({
      method: 'GET',
      path: `/v3/session/${encodeURIComponent(normalized)}/decision/`,
      correlationId,
    });
  }

  private async requestJson<T>(request: DiditRequest): Promise<T> {
    const config = readDiditConfig();
    const requestId = request.correlationId?.trim() || randomUUID();
    const url = `${config.baseUrl}${request.path}`;
    const startedAt = Date.now();
    let lastFailure: DiditFailure | undefined;

    for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
      try {
        const response = await this.fetchWithTimeout(
          url,
          {
            method: request.method,
            headers: this.headers(config.apiKey, requestId, request.body),
            body: request.body === undefined ? undefined : JSON.stringify(request.body),
          },
          config.timeoutMs,
        );

        const parsed = await this.parseResponse<T>(response, request.path, requestId);
        if (attempt > 0) {
          this.logger.log(`Didit recovered path=${request.path} attempt=${attempt + 1} requestId=${requestId}`);
        }
        return parsed;
      } catch (error) {
        const failure = this.normalizeFailure(error, request.path, requestId);
        lastFailure = failure;

        if (!failure.retryable || attempt >= config.maxRetries) {
          this.logFailure(failure, attempt + 1, Date.now() - startedAt);
          throw this.toException(failure);
        }

        this.logger.warn(
          `Didit retry path=${request.path} status=${failure.status} attempt=${attempt + 1}/${config.maxRetries + 1} requestId=${requestId}`,
        );
        await this.sleep(this.retryDelayMs(attempt));
      }
    }

    throw this.toException(
      lastFailure ?? {
        status: 502,
        path: request.path,
        detail: 'DIDIT_REQUEST_FAILED',
        requestId,
        retryable: false,
      },
    );
  }

  private headers(apiKey: string, requestId: string, body?: unknown): Record<string, string> {
    return {
      'x-api-key': apiKey,
      accept: 'application/json',
      'x-request-id': requestId,
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
    };
  }

  private async fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw { status: 504, detail: 'DIDIT_TIMEOUT', retryable: true };
      }
      throw { status: 502, detail: 'DIDIT_NETWORK_ERROR', retryable: true };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async parseResponse<T>(response: Response, path: string, requestId: string): Promise<T> {
    const text = await response.text();
    const parsed = this.parseBody(text);

    if (!response.ok) {
      throw {
        status: response.status,
        path,
        detail: this.detail(parsed, text),
        providerCode: this.providerCode(parsed),
        requestId,
        retryable: this.isRetryableStatus(response.status),
      } satisfies DiditFailure;
    }

    if (!text) return {} as T;
    if (typeof parsed === 'string') {
      throw {
        status: 502,
        path,
        detail: 'DIDIT_RESPONSE_NOT_JSON',
        requestId,
        retryable: false,
      } satisfies DiditFailure;
    }
    return parsed as T;
  }

  private parseBody(text: string): Record<string, unknown> | string {
    if (!text) return {};
    try {
      const parsed = JSON.parse(text) as unknown;
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : String(parsed);
    } catch {
      return text.slice(0, MAX_ERROR_LOG_CHARS);
    }
  }

  private normalizeFailure(error: unknown, path: string, requestId: string): DiditFailure {
    if (this.isFailure(error)) return error;
    if (typeof error === 'object' && error && 'status' in error) {
      const partial = error as { status?: unknown; detail?: unknown; retryable?: unknown };
      return {
        status: typeof partial.status === 'number' ? partial.status : 502,
        path,
        detail: typeof partial.detail === 'string' ? partial.detail : 'DIDIT_REQUEST_FAILED',
        requestId,
        retryable: typeof partial.retryable === 'boolean' ? partial.retryable : false,
      };
    }
    return {
      status: 502,
      path,
      detail: error instanceof Error ? error.message : 'DIDIT_UNKNOWN_ERROR',
      requestId,
      retryable: false,
    };
  }

  private isFailure(error: unknown): error is DiditFailure {
    return Boolean(
      error &&
        typeof error === 'object' &&
        typeof (error as DiditFailure).status === 'number' &&
        typeof (error as DiditFailure).path === 'string' &&
        typeof (error as DiditFailure).detail === 'string' &&
        typeof (error as DiditFailure).requestId === 'string',
    );
  }

  private toException(failure: DiditFailure): Error {
    if (failure.status === 400) {
      return new BadRequestException({
        code: 'DIDIT_REQUEST_REJECTED',
        message: 'Didit rejected the verification request.',
        providerCode: failure.providerCode,
        requestId: failure.requestId,
      });
    }

    if (failure.status === 401 || failure.status === 403) {
      return new BadGatewayException({
        code: 'DIDIT_AUTHORIZATION_FAILED',
        message: 'Didit authorization failed. Check API key, workflow, permissions and credits.',
        requestId: failure.requestId,
      });
    }

    if (failure.status === 404) {
      return new BadGatewayException({
        code: 'DIDIT_RESOURCE_NOT_FOUND',
        message: 'Didit resource was not found.',
        requestId: failure.requestId,
      });
    }

    if (failure.status === 408 || failure.status === 429 || failure.status === 504) {
      return new BadGatewayException({
        code: 'DIDIT_TEMPORARILY_UNAVAILABLE',
        message: 'Didit did not complete the request in a reliable window.',
        requestId: failure.requestId,
      });
    }

    if (failure.status >= 500) {
      return new BadGatewayException({
        code: 'DIDIT_UPSTREAM_FAILURE',
        message: 'Didit upstream service failed.',
        requestId: failure.requestId,
      });
    }

    return new BadGatewayException({
      code: 'DIDIT_UNEXPECTED_FAILURE',
      message: 'Didit returned an unexpected response.',
      requestId: failure.requestId,
    });
  }

  private logFailure(failure: DiditFailure, attempts: number, elapsedMs: number): void {
    this.logger.warn(
      [
        'Didit failure',
        `path=${failure.path}`,
        `status=${failure.status}`,
        `attempts=${attempts}`,
        `elapsedMs=${elapsedMs}`,
        `retryable=${failure.retryable}`,
        `requestId=${failure.requestId}`,
        `providerCode=${failure.providerCode ?? 'none'}`,
        `detail=${this.safeLogText(failure.detail)}`,
      ].join(' '),
    );
  }

  private providerCode(parsed: Record<string, unknown> | string): string | undefined {
    if (typeof parsed !== 'object' || parsed === null) return undefined;
    const value = parsed.error ?? parsed.code;
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private detail(parsed: Record<string, unknown> | string, raw: string): string {
    if (typeof parsed === 'string') return parsed.slice(0, MAX_ERROR_LOG_CHARS);
    for (const key of ['detail', 'message', 'error', 'code']) {
      const value = parsed[key];
      if (typeof value === 'string' && value.trim()) return value.trim().slice(0, MAX_ERROR_LOG_CHARS);
    }
    return raw.slice(0, MAX_ERROR_LOG_CHARS) || 'DIDIT_EMPTY_ERROR_BODY';
  }

  private isRetryableStatus(status: number): boolean {
    return status === 408 || status === 429 || status === 502 || status === 503 || status === 504;
  }

  private retryDelayMs(attempt: number): number {
    return 250 * 2 ** attempt + Math.floor(Math.random() * 125);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private assertCreateSessionInput(input: DiditCreateSessionInput): void {
    if (!input?.vendorData?.trim()) throw new BadRequestException('DIDIT_VENDOR_DATA_REQUIRED');
    if (input.vendorData.length > MAX_VENDOR_DATA_CHARS) throw new BadRequestException('DIDIT_VENDOR_DATA_TOO_LONG');
    if (!input.callback?.trim()) throw new BadRequestException('DIDIT_CALLBACK_REQUIRED');
    this.assertCallback(input.callback);
    if (input.language && !/^[a-z]{2}(-[A-Z]{2})?$/.test(input.language.trim())) {
      throw new BadRequestException('DIDIT_LANGUAGE_INVALID');
    }
    if (input.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.contactEmail.trim())) {
      throw new BadRequestException('DIDIT_CONTACT_EMAIL_INVALID');
    }
    if (input.metadata) this.assertJsonBudget('DIDIT_METADATA_TOO_LARGE', input.metadata);
    if (input.expectedDetails) this.assertJsonBudget('DIDIT_EXPECTED_DETAILS_TOO_LARGE', input.expectedDetails);
  }

  private assertCallback(callback: string): void {
    try {
      const url = new URL(callback);
      if (!['https:', 'http:', 'regenera:', 'regenerabank:'].includes(url.protocol)) {
        throw new Error('invalid callback protocol');
      }
      if (url.protocol === 'http:' && process.env.NODE_ENV === 'production') {
        const local = ['localhost', '127.0.0.1'].includes(url.hostname) || url.hostname.endsWith('.local');
        if (!local) throw new Error('plain HTTP forbidden');
      }
    } catch {
      throw new BadRequestException('DIDIT_CALLBACK_INVALID');
    }
  }

  private assertJsonBudget(code: string, value: Record<string, unknown>): void {
    if (Buffer.byteLength(JSON.stringify(value), 'utf8') > MAX_JSON_BUDGET_BYTES) {
      throw new BadRequestException(code);
    }
  }

  private withDiditMetadata(
    metadata: Record<string, unknown>,
    input: DiditCreateSessionInput,
  ): Record<string, unknown> {
    return {
      ...metadata,
      ...(input.documentType ? { regenera_document_type: input.documentType } : {}),
      ...(input.documentFormat ? { regenera_document_format: input.documentFormat } : {}),
    };
  }

  private assertCreateSessionResponse(response: DiditCreateSessionResponse): void {
    if (!response || typeof response !== 'object') {
      throw new BadGatewayException('DIDIT_SESSION_RESPONSE_INVALID');
    }
    if (typeof response.session_id !== 'string' || !response.session_id.trim()) {
      throw new BadGatewayException('DIDIT_SESSION_ID_MISSING');
    }
    if (typeof response.url !== 'string' || !response.url.trim()) {
      throw new BadGatewayException('DIDIT_SESSION_URL_MISSING');
    }
    if (typeof response.status !== 'string') {
      throw new BadGatewayException('DIDIT_SESSION_STATUS_MISSING');
    }
  }

  private safeLogText(value: string): string {
    return value
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
      .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, '[cpf]')
      .replace(/\b\d{11}\b/g, '[id]')
      .slice(0, MAX_ERROR_LOG_CHARS);
  }
}
