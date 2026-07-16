import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { PrometeoTransferLog } from './prometeo-payments.types';

interface TransferLogListResponse {
  readonly status?: string;
  readonly result?: PrometeoTransferLog[];
}

interface TransferLogDetailResponse {
  readonly status?: string;
  readonly transfer?: PrometeoTransferLog;
}

@Injectable()
export class PrometeoBankingClient {
  private readonly logger = new Logger(PrometeoBankingClient.name);

  private resolveBaseUrl(): string {
    return (
      process.env.PROMETEO_BASE_URL?.trim() ||
      'https://banking.sandbox.prometeoapi.com'
    ).replace(/\/$/, '');
  }

  private resolveApiKey(): string {
    const apiKey = process.env.PROMETEO_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException('PROMETEO_API_KEY ausente');
    }
    return apiKey;
  }

  async fetchTransferDetail(requestId: string): Promise<PrometeoTransferLog> {
    const baseUrl = this.resolveBaseUrl();
    const apiKey = this.resolveApiKey();
    const response = await fetch(
      `${baseUrl}/transfer/logs/${encodeURIComponent(requestId)}/`,
      {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(20_000),
      },
    );

    const body = (await this.readJson(response)) as TransferLogDetailResponse;
    if (response.status === 404) {
      throw new ServiceUnavailableException(
        `Transferência ${requestId} não encontrada no Prometeo`,
      );
    }
    if (!response.ok || !body.transfer?.request_id) {
      throw new ServiceUnavailableException(
        `Prometeo transfer detail falhou (${response.status})`,
      );
    }

    this.logger.log(
      `[Prometeo Banking] Detalhe transfer ${requestId} status=${body.transfer.status ?? 'n/a'}`,
    );
    return body.transfer;
  }

  async listTransfers(params: {
    dateStart: string;
    dateEnd: string;
  }): Promise<PrometeoTransferLog[]> {
    const baseUrl = this.resolveBaseUrl();
    const apiKey = this.resolveApiKey();
    const url = new URL(`${baseUrl}/transfer/logs`);
    url.searchParams.set('date_start', params.dateStart);
    url.searchParams.set('date_end', params.dateEnd);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(20_000),
    });

    const body = (await this.readJson(response)) as TransferLogListResponse;
    if (!response.ok) {
      throw new ServiceUnavailableException(
        `Prometeo transfer logs falhou (${response.status})`,
      );
    }
    return body.result ?? [];
  }

  private async readJson(response: Response): Promise<unknown> {
    const text = await response.text();
    if (!text.trim()) {
      return {};
    }
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return { raw: text.slice(0, 200) };
    }
  }
}