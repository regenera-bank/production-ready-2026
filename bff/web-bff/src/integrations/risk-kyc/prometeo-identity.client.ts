import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

export interface PrometeoBasicData {
  readonly TaxIdNumber: number | string;
  readonly TaxIdCountry: string;
  readonly Name: string;
  readonly Gender?: string;
}

export interface PrometeoCpfResult {
  readonly found: boolean;
  readonly basicData?: PrometeoBasicData;
  readonly source: 'prometeo';
}

interface PrometeoCpfResponse {
  data?: { Result?: { BasicData?: PrometeoBasicData } };
  errors?: unknown;
  error?: string;
}

const CACHE_TTL_MS = 60_000;

const isSandboxKeyContext = (): boolean => {
  const identity =
    process.env.PROMETEO_IDENTITY_BASE_URL?.trim() ||
    'https://identity.sandbox.prometeoapi.com';
  const banking =
    process.env.PROMETEO_BASE_URL?.trim() ||
    'https://banking.sandbox.prometeoapi.com';
  return identity.includes('sandbox') || banking.includes('sandbox');
};

@Injectable()
export class PrometeoIdentityClient {
  private readonly logger = new Logger(PrometeoIdentityClient.name);
  private readonly cache = new Map<
    string,
    { readonly result: PrometeoCpfResult; readonly expiresAt: number }
  >();

  async validateCpf(cpf: string): Promise<PrometeoCpfResult> {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) {
      return { found: false, source: 'prometeo' };
    }

    const cached = this.cache.get(digits);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    const apiKey = process.env.PROMETEO_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'PROMETEO_API_KEY obrigatória — sem fallback de identidade',
      );
    }

    let lastError: string | undefined;
    const strategies: Array<() => Promise<PrometeoCpfResult>> = [
      () => this.requestCpfPost(digits, apiKey, this.resolveIdentityBaseUrl()),
      () => this.requestCpfGet(digits, apiKey, this.resolveBankingBaseUrl()),
    ];

    const fallbackUrl = process.env.PROMETEO_IDENTITY_FALLBACK_URL?.trim();
    if (fallbackUrl && fallbackUrl !== this.resolveIdentityBaseUrl()) {
      strategies.unshift(() => this.requestCpfPost(digits, apiKey, fallbackUrl));
    }

    for (const attempt of strategies) {
      try {
        const result = await attempt();
        this.cache.set(digits, {
          result,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });
        return result;
      } catch (error) {
        if (error instanceof ServiceUnavailableException) {
          throw error;
        }
        lastError = error instanceof Error ? error.message : String(error);
        this.logger.warn(`[Prometeo] Tentativa falhou: ${lastError}`);
      }
    }

    throw new ServiceUnavailableException(
      `Prometeo sandbox indisponível: ${lastError ?? 'erro desconhecido'}`,
    );
  }

  private resolveIdentityBaseUrl(): string {
    return (
      process.env.PROMETEO_IDENTITY_BASE_URL?.trim() ||
      'https://identity.sandbox.prometeoapi.com'
    );
  }

  private resolveBankingBaseUrl(): string {
    return (
      process.env.PROMETEO_BASE_URL?.trim() ||
      'https://banking.sandbox.prometeoapi.com'
    );
  }

  private async requestCpfPost(
    digits: string,
    apiKey: string,
    baseUrl: string,
  ): Promise<PrometeoCpfResult> {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/cpf/`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ document_number: digits }),
      signal: AbortSignal.timeout(20_000),
    });

    return this.interpretResponse(response, digits, `${baseUrl}/cpf/ POST`);
  }

  private async requestCpfGet(
    digits: string,
    apiKey: string,
    baseUrl: string,
  ): Promise<PrometeoCpfResult> {
    const url = new URL(`${baseUrl.replace(/\/$/, '')}/cpf/`);
    url.searchParams.set('document_number', digits);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(20_000),
    });

    return this.interpretResponse(response, digits, `${baseUrl}/cpf/ GET`);
  }

  private async interpretResponse(
    response: Response,
    digits: string,
    label: string,
  ): Promise<PrometeoCpfResult> {
    const payload = await this.readJsonBody(response);

    if (response.status === 401) {
      const hint = isSandboxKeyContext()
        ? 'Use chave Sandbox com identity.sandbox.prometeoapi.com (não produção).'
        : 'Verifique PROMETEO_API_KEY e o ambiente (sandbox vs produção).';
      throw new ServiceUnavailableException(
        `Prometeo rejeitou a API Key (401) em ${label} — ${hint}`,
      );
    }

    const basicData = payload.data?.Result?.BasicData;
    if (response.ok && basicData?.Name) {
      this.logger.log(
        `[Prometeo] CPF validado via ${label} (***.${digits.substring(3, 6)}.***)`,
      );
      return { found: true, basicData, source: 'prometeo' };
    }

    this.logger.warn(
      `[Prometeo] ${label} ${response.status}: ${payload.error ?? JSON.stringify(payload.errors ?? {})}`,
    );
    return { found: false, source: 'prometeo' };
  }

  private async readJsonBody(
    response: Response,
  ): Promise<PrometeoCpfResponse> {
    const text = await response.text();
    if (!text.trim()) {
      return {};
    }
    try {
      return JSON.parse(text) as PrometeoCpfResponse;
    } catch {
      this.logger.warn(
        `[Prometeo] Corpo não-JSON (${response.status}): ${text.slice(0, 160)}`,
      );
      return { error: text.slice(0, 160) };
    }
  }
}